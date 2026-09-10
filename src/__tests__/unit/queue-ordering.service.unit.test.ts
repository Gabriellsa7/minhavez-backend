import {
  mergeInterleavedByPriority,
  QueueOrderingService,
} from '../../domain/queue-item/service/queue-ordering.service';
import {
  EQueueItemPriority,
  EQueueItemStatus,
  IQueueItem,
} from '../../domain/queue-item/interfaces/queue-item.interface';

const NOW = new Date('2026-01-10T12:00:00.000Z');
const HOUR = 60 * 60 * 1000;

function buildItem(overrides: Partial<IQueueItem> & { _id: string }): IQueueItem {
  return {
    queueId: 'queue-1',
    patientId: `patient-${overrides._id}`,
    code: overrides._id,
    position: null,
    priority: EQueueItemPriority.MEDIUM,
    missedCalls: 0,
    status: EQueueItemStatus.WAITING,
    scheduledDateTime: NOW,
    isWalkIn: false,
    positionRevealedAt: null,
    ...overrides,
  };
}

function createFakeRepository(initialItems: IQueueItem[]) {
  const items = initialItems.map((item) => ({ ...item }));

  return {
    items,
    listQueueItems: jest.fn(async (filter: Partial<IQueueItem>) => {
      return items
        .filter((item) =>
          Object.entries(filter).every(
            ([key, value]) => (item as Record<string, unknown>)[key] === value,
          ),
        )
        .map((item) => ({ ...item }));
    }),
    updateQueueItemById: jest.fn(
      async (id: string, params: Partial<IQueueItem>) => {
        const item = items.find((candidate) => candidate._id === id);
        if (!item) return null;
        Object.assign(item, params);
        return { ...item };
      },
    ),
    findDistinctQueueIdsPendingPromotion: jest.fn(async () => []),
  };
}

function createFakeNotificationService() {
  return {
    handleQueuePositionChange: jest.fn(async () => null),
    handleQueuePositionRevealed: jest.fn(async () => null),
  };
}

describe('mergeInterleavedByPriority', () => {
  it('alternates AP, AN, AP, AN, ... when both lines have people waiting', () => {
    const anGroup = [1, 2, 3, 4, 5].map((n) =>
      buildItem({ _id: `an-${n}`, priority: EQueueItemPriority.MEDIUM }),
    );
    const apGroup = [1, 2, 3, 4, 5].map((n) =>
      buildItem({ _id: `ap-${n}`, priority: EQueueItemPriority.HIGH }),
    );

    const result = mergeInterleavedByPriority(apGroup, anGroup).map(
      (item) => item._id,
    );

    expect(result).toEqual([
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

  it('falls back to the remaining line, in order, once the other line is exhausted', () => {
    const anGroup = [1, 2, 3].map((n) =>
      buildItem({ _id: `an-${n}`, priority: EQueueItemPriority.MEDIUM }),
    );
    const apGroup = [buildItem({ _id: 'ap-1', priority: EQueueItemPriority.HIGH })];

    const result = mergeInterleavedByPriority(apGroup, anGroup).map(
      (item) => item._id,
    );

    expect(result).toEqual(['ap-1', 'an-1', 'an-2', 'an-3']);
  });

  it('produces AN, AP, AN when a single priority patient is scheduled between two regular ones', () => {
    const anGroup = [
      buildItem({
        _id: 'an-1',
        priority: EQueueItemPriority.MEDIUM,
        scheduledDateTime: new Date(NOW.getTime() + 10 * 60 * 1000),
      }),
      buildItem({
        _id: 'an-2',
        priority: EQueueItemPriority.MEDIUM,
        scheduledDateTime: new Date(NOW.getTime() + 30 * 60 * 1000),
      }),
    ];
    const apGroup = [
      buildItem({
        _id: 'ap-1',
        priority: EQueueItemPriority.HIGH,
        scheduledDateTime: new Date(NOW.getTime() + 20 * 60 * 1000),
      }),
    ];

    const result = mergeInterleavedByPriority(apGroup, anGroup).map(
      (item) => item._id,
    );

    expect(result).toEqual(['an-1', 'ap-1', 'an-2']);
  });

  it('behaves as plain FIFO when there is no priority patient', () => {
    const anGroup = [1, 2, 3].map((n) =>
      buildItem({ _id: `an-${n}`, priority: EQueueItemPriority.MEDIUM }),
    );

    const result = mergeInterleavedByPriority([], anGroup).map(
      (item) => item._id,
    );

    expect(result).toEqual(['an-1', 'an-2', 'an-3']);
  });
});

describe('QueueOrderingService.recalculatePositions', () => {
  it('assigns position: null to items whose appointment is more than 2h away', async () => {
    const items = [
      buildItem({
        _id: 'far-1',
        scheduledDateTime: new Date(NOW.getTime() + 3 * HOUR),
      }),
    ];
    const repository = createFakeRepository(items);
    const notificationService = createFakeNotificationService();
    const service = new QueueOrderingService({
      queueItemRepository: repository,
      queueNotificationService: notificationService,
    });

    await service.recalculatePositions('queue-1', NOW);

    expect(repository.items[0].position).toBeNull();
    expect(repository.items[0].positionRevealedAt).toBeNull();
  });

  it('assigns a position and reveals it once the item crosses the 2h window', async () => {
    const items = [
      buildItem({
        _id: 'near-1',
        scheduledDateTime: new Date(NOW.getTime() + HOUR),
      }),
    ];
    const repository = createFakeRepository(items);
    const notificationService = createFakeNotificationService();
    const service = new QueueOrderingService({
      queueItemRepository: repository,
      queueNotificationService: notificationService,
    });

    await service.recalculatePositions('queue-1', NOW);

    expect(repository.items[0].position).toBe(1);
    expect(repository.items[0].positionRevealedAt).toEqual(NOW);
    expect(notificationService.handleQueuePositionRevealed).toHaveBeenCalledTimes(
      1,
    );
  });

  it('orders items within the window as AN, AP, AN by schedule + priority', async () => {
    const items = [
      buildItem({
        _id: 'an-1',
        scheduledDateTime: new Date(NOW.getTime() + 10 * 60 * 1000),
        priority: EQueueItemPriority.MEDIUM,
      }),
      buildItem({
        _id: 'ap-1',
        scheduledDateTime: new Date(NOW.getTime() + 20 * 60 * 1000),
        priority: EQueueItemPriority.HIGH,
      }),
      buildItem({
        _id: 'an-2',
        scheduledDateTime: new Date(NOW.getTime() + 30 * 60 * 1000),
        priority: EQueueItemPriority.MEDIUM,
      }),
    ];
    const repository = createFakeRepository(items);
    const service = new QueueOrderingService({
      queueItemRepository: repository,
    });

    await service.recalculatePositions('queue-1', NOW);

    const byId = Object.fromEntries(
      repository.items.map((item) => [item._id, item.position]),
    );
    expect(byId).toEqual({ 'an-1': 1, 'ap-1': 2, 'an-2': 3 });
  });

  it('places a walk-in inserted between two existing appointments in the correct position', async () => {
    const items = [
      buildItem({
        _id: 'patient-10h',
        scheduledDateTime: new Date(NOW.getTime() + 10 * 60 * 1000),
      }),
      buildItem({
        _id: 'patient-11h30',
        scheduledDateTime: new Date(NOW.getTime() + 90 * 60 * 1000),
      }),
    ];
    const repository = createFakeRepository(items);
    const service = new QueueOrderingService({
      queueItemRepository: repository,
    });

    await repository.items.push(
      buildItem({
        _id: 'walk-in-11h',
        scheduledDateTime: new Date(NOW.getTime() + 60 * 60 * 1000),
        isWalkIn: true,
      }),
    );

    await service.recalculatePositions('queue-1', NOW);

    const byId = Object.fromEntries(
      repository.items.map((item) => [item._id, item.position]),
    );
    expect(byId).toEqual({
      'patient-10h': 1,
      'walk-in-11h': 2,
      'patient-11h30': 3,
    });
  });

  it('breaks a schedule tie using check-in time, then creation time', async () => {
    const sameSchedule = new Date(NOW.getTime() + 10 * 60 * 1000);
    const items = [
      buildItem({
        _id: 'created-later',
        scheduledDateTime: sameSchedule,
        createdAt: new Date(NOW.getTime() - 1000),
      }),
      buildItem({
        _id: 'created-earlier',
        scheduledDateTime: sameSchedule,
        createdAt: new Date(NOW.getTime() - 2000),
      }),
      buildItem({
        _id: 'checked-in',
        scheduledDateTime: sameSchedule,
        createdAt: new Date(NOW.getTime() - 500),
        checkInTime: new Date(NOW.getTime() - 100),
      }),
    ];
    const repository = createFakeRepository(items);
    const service = new QueueOrderingService({
      queueItemRepository: repository,
    });

    await service.recalculatePositions('queue-1', NOW);

    const byId = Object.fromEntries(
      repository.items.map((item) => [item._id, item.position]),
    );
    expect(byId).toEqual({
      'checked-in': 1,
      'created-earlier': 2,
      'created-later': 3,
    });
  });

  it('is idempotent: running twice with no state change triggers no further updates or notifications', async () => {
    const items = [
      buildItem({
        _id: 'near-1',
        scheduledDateTime: new Date(NOW.getTime() + HOUR),
      }),
    ];
    const repository = createFakeRepository(items);
    const notificationService = createFakeNotificationService();
    const service = new QueueOrderingService({
      queueItemRepository: repository,
      queueNotificationService: notificationService,
    });

    await service.recalculatePositions('queue-1', NOW);
    repository.updateQueueItemById.mockClear();
    notificationService.handleQueuePositionChange.mockClear();
    notificationService.handleQueuePositionRevealed.mockClear();

    await service.recalculatePositions('queue-1', NOW);

    expect(repository.updateQueueItemById).not.toHaveBeenCalled();
    expect(notificationService.handleQueuePositionChange).not.toHaveBeenCalled();
    expect(
      notificationService.handleQueuePositionRevealed,
    ).not.toHaveBeenCalled();
  });
});
