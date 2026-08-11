import { pickNextWaitingQueueItem } from '../../domain/queue-item/utils/pick-next-queue-item';
import {
  EQueueItemPriority,
  EQueueItemStatus,
  IQueueItem,
} from '../../domain/queue-item/interfaces/queue-item.interface';

function buildItem(
  id: string,
  position: number,
  priority: EQueueItemPriority,
): IQueueItem {
  return {
    _id: id,
    queueId: 'queue-1',
    patientId: `patient-${id}`,
    code: id,
    position,
    priority,
    missedCalls: 0,
    status: EQueueItemStatus.WAITING,
  };
}

function createFakeRepository(initialItems: IQueueItem[]) {
  const items = initialItems.map((item) => ({ ...item }));

  return {
    items,
    getLastCalledQueueItem: jest.fn(async (queueId: string) => {
      const called = items
        .filter((item) => item.queueId === queueId && item.calledAt)
        .sort(
          (left, right) =>
            (right.calledAt as Date).getTime() -
            (left.calledAt as Date).getTime(),
        );
      return called[0] ? { ...called[0] } : null;
    }),
    getNextWaitingQueueItemByPriorityGroup: jest.fn(
      async (queueId: string, isPriority: boolean) => {
        const waiting = items
          .filter(
            (item) =>
              item.queueId === queueId &&
              item.status === EQueueItemStatus.WAITING &&
              (isPriority
                ? item.priority === EQueueItemPriority.HIGH
                : item.priority !== EQueueItemPriority.HIGH),
          )
          .sort((left, right) => left.position - right.position);
        return waiting[0] ? { ...waiting[0] } : null;
      },
    ),
    getNextWaitingQueueItem: jest.fn(async (queueId: string) => {
      const waiting = items
        .filter(
          (item) =>
            item.queueId === queueId &&
            item.status === EQueueItemStatus.WAITING,
        )
        .sort((left, right) => left.position - right.position);
      return waiting[0] ? { ...waiting[0] } : null;
    }),
  };
}

// Simulates repeatedly calling the next person into service, marking them
// called so the alternation has a "last called" to react to on the next pick.
async function simulateCallOrder(
  repository: ReturnType<typeof createFakeRepository>,
  callsToSimulate: number,
): Promise<string[]> {
  const order: string[] = [];
  let clock = 0;

  for (let i = 0; i < callsToSimulate; i += 1) {
    const next = await pickNextWaitingQueueItem('queue-1', repository);
    if (!next) break;

    order.push(next._id);

    const item = repository.items.find((candidate) => candidate._id === next._id);
    if (item) {
      item.status = EQueueItemStatus.IN_SERVICE;
      clock += 1;
      item.calledAt = new Date(clock * 1000);
    }
  }

  return order;
}

describe('pickNextWaitingQueueItem', () => {
  it('alternates AP, AN, AP, AN, ... when both lines have people waiting', async () => {
    const items: IQueueItem[] = [
      buildItem('an-1', 1, EQueueItemPriority.MEDIUM),
      buildItem('an-2', 2, EQueueItemPriority.MEDIUM),
      buildItem('an-3', 3, EQueueItemPriority.MEDIUM),
      buildItem('an-4', 4, EQueueItemPriority.MEDIUM),
      buildItem('an-5', 5, EQueueItemPriority.MEDIUM),
      buildItem('ap-1', 6, EQueueItemPriority.HIGH),
      buildItem('ap-2', 7, EQueueItemPriority.HIGH),
      buildItem('ap-3', 8, EQueueItemPriority.HIGH),
      buildItem('ap-4', 9, EQueueItemPriority.HIGH),
      buildItem('ap-5', 10, EQueueItemPriority.HIGH),
    ];

    const repository = createFakeRepository(items);
    const order = await simulateCallOrder(repository, 10);

    expect(order).toEqual([
      'ap-1',
      'an-1',
      'ap-2',
      'an-2',
      'ap-3',
      'an-3',
      'ap-4',
      'an-4',
      'ap-5',
      'an-5',
    ]);
  });

  it('falls back to the remaining line, in FIFO order, once the other line is exhausted', async () => {
    const items: IQueueItem[] = [
      buildItem('an-1', 1, EQueueItemPriority.MEDIUM),
      buildItem('an-2', 2, EQueueItemPriority.MEDIUM),
      buildItem('an-3', 3, EQueueItemPriority.MEDIUM),
      buildItem('ap-1', 4, EQueueItemPriority.HIGH),
    ];

    const repository = createFakeRepository(items);
    const order = await simulateCallOrder(repository, 4);

    expect(order).toEqual(['ap-1', 'an-1', 'an-2', 'an-3']);
  });

  it('behaves as plain FIFO when there is no priority patient in the queue', async () => {
    const items: IQueueItem[] = [
      buildItem('an-1', 1, EQueueItemPriority.MEDIUM),
      buildItem('an-2', 2, EQueueItemPriority.MEDIUM),
      buildItem('an-3', 3, EQueueItemPriority.MEDIUM),
    ];

    const repository = createFakeRepository(items);
    const order = await simulateCallOrder(repository, 3);

    expect(order).toEqual(['an-1', 'an-2', 'an-3']);
  });

  it('returns null when there is nobody waiting', async () => {
    const repository = createFakeRepository([]);

    const next = await pickNextWaitingQueueItem('queue-1', repository);

    expect(next).toBeNull();
  });
});
