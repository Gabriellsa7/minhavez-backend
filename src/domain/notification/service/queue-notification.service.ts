import IORedis from 'ioredis';
import {
  ENotificationStatus,
  ENotificationType,
  INotification,
} from '../interfaces/notification.interface';
import { IQueueItem } from '../../queue-item/interfaces/queue-item.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { notificationQueueConfig } from '../../../infrastructure/config/notification.constants';
import { BullMqProvider } from '../../../infrastructure/queue/bullmq/bullmq.provider';

export interface IParamsQueueNotificationService {
  notificationService: Pick<INotificationService, 'createNotification'>;
  redisClient?: IORedis;
}

export class QueueNotificationService {
  private static readonly DEDUPE_TTL_SECONDS = 60 * 60 * 24;

  private readonly notificationService: Pick<
    INotificationService,
    'createNotification'
  >;
  private readonly redisClient: IORedis;

  constructor(params: IParamsQueueNotificationService) {
    this.notificationService = params.notificationService;
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

  private getNotificationType(position: number): ENotificationType {
    if (position <= 3) {
      return ENotificationType.QUEUE_NEXT;
    }

    return ENotificationType.QUEUE_NEAR;
  }
}
