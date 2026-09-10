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
import { EQueueStatus } from '../../queue/interfaces/queue.interface';
import { notificationQueueConfig } from '../../../infrastructure/config/notification.constants';
import { BullMqProvider } from '../../../infrastructure/queue/bullmq/bullmq.provider';
import { isSameBrazilDay } from '../../../shared/utils/brazilTime';

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

      if (position == null || !thresholds.includes(position)) {
        return null;
      }

      const isQueueOpenToday = await this.isQueueOpenToday(queueItem.queueId);
      if (!isQueueOpenToday) {
        Logger.info(
          'Skipped queue position notification: queue not open today',
          {
            patientId: queueItem.patientId,
            queueItemId: queueItem._id,
            queueId: queueItem.queueId,
            position,
          },
        );
        return null;
      }

      const dedupeKey = `notification:dedupe:${queueItem._id}:${position}`;
      const acquired = await this.redisClient.set(
        dedupeKey,
        '1',
        'EX',
        QueueNotificationService.DEDUPE_TTL_SECONDS,
        'NX',
      );
      if (acquired !== 'OK') {
        Logger.info(
          'Skipped queue position notification: already sent for this threshold',
          {
            patientId: queueItem.patientId,
            queueItemId: queueItem._id,
            position,
          },
        );
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

  async handleQueuePositionRevealed(
    queueItem: IQueueItem,
  ): Promise<INotification | null> {
    try {
      const isQueueOpenToday = await this.isQueueOpenToday(queueItem.queueId);
      if (!isQueueOpenToday) {
        Logger.info(
          'Skipped queue position revealed notification: queue not open today',
          {
            patientId: queueItem.patientId,
            queueItemId: queueItem._id,
            queueId: queueItem.queueId,
          },
        );
        return null;
      }

      const notification = await this.notificationService.createNotification({
        patientId: queueItem.patientId,
        title: 'Acompanhe sua posição na fila',
        message: `Sua consulta entrou na janela de acompanhamento da fila. Sua posição atual é ${queueItem.position}.`,
        type: ENotificationType.QUEUE_WINDOW_OPENED,
        status: ENotificationStatus.PENDING,
        queueItemId: queueItem._id,
        priority: notificationQueueConfig.priorities.default,
      });

      Logger.info('Queue position revealed notification created', {
        patientId: queueItem.patientId,
        queueItemId: queueItem._id,
        position: queueItem.position,
        notificationId: notification._id,
      });

      return notification;
    } catch (error) {
      Logger.error('Failed to process queue position revealed notification', {
        patientId: queueItem.patientId,
        queueItemId: queueItem._id,
        queueId: queueItem.queueId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async isQueueOpenToday(queueId: string): Promise<boolean> {
    const queue = await this.queueRepository.getQueueById(queueId);
    if (!queue) {
      return false;
    }

    const isToday = isSameBrazilDay(new Date(queue.queueDate), new Date());
    const isOpen =
      queue.status === EQueueStatus.OPEN ||
      queue.status === EQueueStatus.IN_PROGRESS;

    return isToday && isOpen;
  }

  private getNotificationType(position: number): ENotificationType {
    if (position <= 3) {
      return ENotificationType.QUEUE_NEXT;
    }

    return ENotificationType.QUEUE_NEAR;
  }
}
