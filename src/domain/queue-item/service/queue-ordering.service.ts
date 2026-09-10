import {
  EQueueItemPriority,
  EQueueItemStatus,
  IQueueItem,
} from '../interfaces/queue-item.interface';
import { IQueueItemRepository } from '../repository/queue-item.repository.interface';
import { QueueNotificationService } from '../../notification/service/queue-notification.service';
import { INotificationSocketGateway } from '../../notification/interfaces/notification-socket.interface';
import { QUEUE_POSITION_WINDOW_MS } from '../../../infrastructure/config/queue-position-window.constants';

export function mergeInterleavedByPriority(
  apGroup: IQueueItem[],
  anGroup: IQueueItem[],
): IQueueItem[] {
  const ap = [...apGroup];
  const an = [...anGroup];
  const result: IQueueItem[] = [];
  let lastWasHigh: boolean | null = null;

  while (ap.length > 0 || an.length > 0) {
    let takeFromAp: boolean;

    if (ap.length === 0) {
      takeFromAp = false;
    } else if (an.length === 0) {
      takeFromAp = true;
    } else if (lastWasHigh === null) {
      takeFromAp = compareByScheduleThenTieBreak(ap[0], an[0]) <= 0;
    } else {
      takeFromAp = !lastWasHigh;
    }

    const next: IQueueItem = takeFromAp ? ap.shift()! : an.shift()!;
    result.push(next);
    lastWasHigh = next.priority === EQueueItemPriority.HIGH;
  }

  return result;
}

function compareByScheduleThenTieBreak(
  left: IQueueItem,
  right: IQueueItem,
): number {
  const scheduleDiff =
    new Date(left.scheduledDateTime).getTime() -
    new Date(right.scheduledDateTime).getTime();
  if (scheduleDiff !== 0) return scheduleDiff;

  const leftCheckIn = left.checkInTime
    ? new Date(left.checkInTime).getTime()
    : null;
  const rightCheckIn = right.checkInTime
    ? new Date(right.checkInTime).getTime()
    : null;

  if (leftCheckIn !== null && rightCheckIn !== null) {
    if (leftCheckIn !== rightCheckIn) return leftCheckIn - rightCheckIn;
  } else if (leftCheckIn !== null) {
    return -1;
  } else if (rightCheckIn !== null) {
    return 1;
  }

  const leftCreated = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightCreated = right.createdAt
    ? new Date(right.createdAt).getTime()
    : 0;
  return leftCreated - rightCreated;
}

type IQueueOrderingRepository = Pick<
  IQueueItemRepository,
  'listQueueItems' | 'updateQueueItemById' | 'findDistinctQueueIdsPendingPromotion'
>;

export class QueueOrderingService {
  private queueItemRepository: IQueueOrderingRepository;
  private queueNotificationService?: Pick<
    QueueNotificationService,
    'handleQueuePositionChange' | 'handleQueuePositionRevealed'
  >;
  private notificationSocketGateway?: INotificationSocketGateway;

  constructor(params: {
    queueItemRepository: IQueueOrderingRepository;
    queueNotificationService?: Pick<
      QueueNotificationService,
      'handleQueuePositionChange' | 'handleQueuePositionRevealed'
    >;
    notificationSocketGateway?: INotificationSocketGateway;
  }) {
    this.queueItemRepository = params.queueItemRepository;
    this.queueNotificationService = params.queueNotificationService;
    this.notificationSocketGateway = params.notificationSocketGateway;
  }

  async recalculatePositions(
    queueId: string,
    now: Date = new Date(),
  ): Promise<void> {
    const waitingItems = (
      await this.queueItemRepository.listQueueItems({ queueId })
    ).filter((item) => item.status === EQueueItemStatus.WAITING);

    const inWindow: IQueueItem[] = [];
    const outOfWindow: IQueueItem[] = [];

    for (const item of waitingItems) {
      const msUntilAppointment =
        new Date(item.scheduledDateTime).getTime() - now.getTime();

      if (msUntilAppointment <= QUEUE_POSITION_WINDOW_MS) {
        inWindow.push(item);
      } else {
        outOfWindow.push(item);
      }
    }

    const apGroup = inWindow
      .filter((item) => item.priority === EQueueItemPriority.HIGH)
      .sort(compareByScheduleThenTieBreak);
    const anGroup = inWindow
      .filter((item) => item.priority !== EQueueItemPriority.HIGH)
      .sort(compareByScheduleThenTieBreak);

    const ordered = mergeInterleavedByPriority(apGroup, anGroup);

    const changed: IQueueItem[] = [];
    const revealed: IQueueItem[] = [];

    for (const [index, item] of ordered.entries()) {
      const position = index + 1;
      const updates: Partial<IQueueItem> = {};

      if (item.position !== position) {
        updates.position = position;
      }
      if (!item.positionRevealedAt) {
        updates.positionRevealedAt = now;
      }

      if (Object.keys(updates).length > 0) {
        const updated = await this.queueItemRepository.updateQueueItemById(
          item._id,
          updates,
        );
        if (updated) {
          changed.push(updated);
          if (updates.positionRevealedAt) revealed.push(updated);
        }
      }
    }

    for (const item of outOfWindow) {
      if (item.position !== null) {
        const updated = await this.queueItemRepository.updateQueueItemById(
          item._id,
          { position: null },
        );
        if (updated) changed.push(updated);
      }
    }

    for (const item of changed) {
      await this.queueNotificationService?.handleQueuePositionChange(item);
    }
    for (const item of revealed) {
      await this.queueNotificationService?.handleQueuePositionRevealed(item);
    }

    if (changed.length > 0) {
      this.notificationSocketGateway?.broadcastNotification({
        type: 'queue.updated',
        queueId,
        changedQueueItemIds: changed.map((item) => item._id),
        promotedQueueItemIds: revealed.map((item) => item._id),
        connectedAt: new Date().toISOString(),
      });
    }
  }

  async promoteDueQueueItems(now: Date = new Date()): Promise<void> {
    const queueIds =
      await this.queueItemRepository.findDistinctQueueIdsPendingPromotion(now);

    for (const queueId of queueIds) {
      await this.recalculatePositions(queueId, now);
    }
  }
}
