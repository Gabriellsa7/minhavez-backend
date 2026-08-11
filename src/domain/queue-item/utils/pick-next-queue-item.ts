import { EQueueItemPriority, IQueueItem } from '../interfaces/queue-item.interface';

export interface IQueueItemPickerRepository {
  getLastCalledQueueItem(queueId: string): Promise<IQueueItem | null>;
  getNextWaitingQueueItemByPriorityGroup(
    queueId: string,
    isPriority: boolean,
  ): Promise<IQueueItem | null>;
  getNextWaitingQueueItem(queueId: string): Promise<IQueueItem | null>;
}

/**
 * Alternates between the priority (AP) and normal (AN) lines — AP, AN, AP,
 * AN, ... — instead of draining one group before ever touching the other.
 * The choice is derived from whichever group was called last (not a stored
 * counter), so it stays correct across manual calls, absences and restarts.
 * Once one side of the alternation runs dry, it falls back to whichever
 * group still has people, so the remaining line keeps advancing in FIFO
 * order instead of stalling.
 */
export async function pickNextWaitingQueueItem(
  queueId: string,
  repository: IQueueItemPickerRepository,
): Promise<IQueueItem | null> {
  const lastCalled = await repository.getLastCalledQueueItem(queueId);
  const shouldCallPriorityNext =
    !lastCalled || lastCalled.priority !== EQueueItemPriority.HIGH;

  const preferred = await repository.getNextWaitingQueueItemByPriorityGroup(
    queueId,
    shouldCallPriorityNext,
  );

  return preferred ?? repository.getNextWaitingQueueItem(queueId);
}
