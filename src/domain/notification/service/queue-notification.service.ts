import IORedis from 'ioredis';
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
      return null;
    }

    // A SET...NX...EX dedupe lock (instead of an in-memory Set) so duplicate
    // threshold crossings are suppressed across process restarts and across
    // multiple backend instances sharing the same Redis.
    const dedupeKey = `notification:dedupe:${queueItem.patientId}:${position}`;
    const acquired = await this.redisClient.set(
      dedupeKey,
      '1',
      'EX',
      QueueNotificationService.DEDUPE_TTL_SECONDS,
      'NX',
    );
    if (acquired !== 'OK') {
      return null;
    }

    const type = this.getNotificationType(position);

    return this.notificationService.createNotification({
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
