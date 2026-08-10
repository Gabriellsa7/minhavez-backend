import IORedis from 'ioredis';
import { Logger } from 'traceability';
import {
  ENotificationStatus,
  ENotificationType,
  INotification,
} from '../interfaces/notification.interface';
import { IQueueItem } from '../../queue-item/interfaces/queue-item.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { IQueueRepository } from '../../queue/repository/queue.repository.interface';
import { notificationQueueConfig } from '../../../infrastructure/config/notification.constants';
import { BullMqProvider } from '../../../infrastructure/queue/bullmq/bullmq.provider';

export interface IParamsQueueNotificationService {
  notificationService: Pick<INotificationService, 'createNotification'>;
  queueRepository: Pick<IQueueRepository, 'getQueueById'>;
  redisClient?: IORedis;
}

export class QueueNotificationService {
  private static readonly DEDUPE_TTL_SECONDS = 60 * 60 * 24;

  private readonly notificationService: Pick<
    INotificationService,
    'createNotification'
  >;
  private readonly queueRepository: Pick<IQueueRepository, 'getQueueById'>;
  private readonly redisClient: IORedis;

  constructor(params: IParamsQueueNotificationService) {
    this.notificationService = params.notificationService;
    this.queueRepository = params.queueRepository;
    this.redisClient = params.redisClient ?? BullMqProvider.getConnection();
  }

  async handleQueuePositionChange(
    queueItem: IQueueItem,
  ): Promise<INotification | null> {
    try {
      const thresholds = notificationQueueConfig.thresholds;
      const position = queueItem.position;

      if (!thresholds.includes(position)) {
        return null;
      }

      // Position notifications only make sense once the patient's queue day
      // has arrived — a queue item can exist days ahead of the appointment,
      // so a threshold crossed early must not notify before that day.
      const isQueueForToday = await this.isQueueDateToday(queueItem.queueId);
      if (!isQueueForToday) {
        Logger.info('Skipped queue position notification: not the queue day', {
          patientId: queueItem.patientId,
          queueItemId: queueItem._id,
          queueId: queueItem.queueId,
          position,
        });
        return null;
      }

      // A SET...NX...EX dedupe lock (instead of an in-memory Set) so duplicate
      // threshold crossings are suppressed across process restarts and across
      // multiple backend instances sharing the same Redis. Scoped to the
      // queue item (not just the patient) so a fresh booking always starts
      // with a clean slate — keying by patientId alone made a patient who
      // had already crossed a threshold in an earlier, unrelated queue
      // session that same day get silently skipped for 24h.
      const dedupeKey = `notification:dedupe:${queueItem._id}:${position}`;
      const acquired = await this.redisClient.set(
        dedupeKey,
        '1',
        'EX',
        QueueNotificationService.DEDUPE_TTL_SECONDS,
        'NX',
      );
      if (acquired !== 'OK') {
        Logger.info('Skipped queue position notification: already sent for this threshold', {
          patientId: queueItem.patientId,
          queueItemId: queueItem._id,
          position,
        });
        return null;
      }

      const type = this.getNotificationType(position);

      const notification = await this.notificationService.createNotification({
        patientId: queueItem.patientId,
        title: 'Sua vez está chegando',
        message: `Sua posição na fila é ${position}.`,
        type,
        status: ENotificationStatus.PENDING,
        queueItemId: queueItem._id,
        priority:
          position <= 3
            ? notificationQueueConfig.priorities.high
            : notificationQueueConfig.priorities.default,
      });

      Logger.info('Queue position notification created', {
        patientId: queueItem.patientId,
        queueItemId: queueItem._id,
        position,
        notificationId: notification._id,
      });

      return notification;
    } catch (error) {
      // A failure here must never break the doctor's call/finish/absent
      // action — the queue state change already succeeded by the time this
      // runs, so the notification side-effect fails independently and loudly
      // in the logs instead of surfacing as a 400 on an unrelated request.
      Logger.error('Failed to process queue position notification', {
        patientId: queueItem.patientId,
        queueItemId: queueItem._id,
        queueId: queueItem.queueId,
        position: queueItem.position,
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async isQueueDateToday(queueId: string): Promise<boolean> {
    const queue = await this.queueRepository.getQueueById(queueId);
    if (!queue) {
      return false;
    }

    const queueDate = new Date(queue.queueDate);
    const today = new Date();

    return (
      queueDate.getFullYear() === today.getFullYear() &&
      queueDate.getMonth() === today.getMonth() &&
      queueDate.getDate() === today.getDate()
    );
  }

  private getNotificationType(position: number): ENotificationType {
    if (position <= 3) {
      return ENotificationType.QUEUE_NEXT;
    }

    return ENotificationType.QUEUE_NEAR;
  }
}
