import {
  EQueueItemPriority,
  IQueueItem,
} from '../interfaces/queue-item.interface';

export interface IQueueItemPickerRepository {
  getLastCalledQueueItem(queueId: string): Promise<IQueueItem | null>;
  getNextWaitingQueueItemByPriorityGroup(
    queueId: string,
    isPriority: boolean,
  ): Promise<IQueueItem | null>;
  getNextWaitingQueueItem(queueId: string): Promise<IQueueItem | null>;
}

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
