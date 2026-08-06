import {
  ENotificationStatus,
  ENotificationType,
  INotification,
} from '../interfaces/notification.interface';
import { IQueueItem } from '../../queue-item/interfaces/queue-item.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { notificationQueueConfig } from '../../../infrastructure/config/notification.constants';

export interface IParamsQueueNotificationService {
  notificationService: Pick<INotificationService, 'createNotification'>;
}

export class QueueNotificationService {
  private readonly notificationService: Pick<
    INotificationService,
    'createNotification'
  >;
  private readonly notifiedPositions = new Set<string>();

  constructor(params: IParamsQueueNotificationService) {
    this.notificationService = params.notificationService;
  }

  async handleQueuePositionChange(
    queueItem: IQueueItem,
  ): Promise<INotification | null> {
    const thresholds = notificationQueueConfig.thresholds;
    const position = queueItem.position;

    if (!thresholds.includes(position)) {
      return null;
    }

    const dedupeKey = `${queueItem.patientId}:${position}`;
    if (this.notifiedPositions.has(dedupeKey)) {
      return null;
    }

    this.notifiedPositions.add(dedupeKey);

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
