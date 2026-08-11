import { QueueItemService } from '../../domain/queue-item/service/queue-item.service';
import {
  EQueueItemStatus,
  EQueueItemPriority,
  IQueueItem,
} from '../../domain/queue-item/interfaces/queue-item.interface';
import { IQueueItemRepository } from '../../domain/queue-item/repository/queue-item.repository.interface';
import { IQueueRepository } from '../../domain/queue/repository/queue.repository.interface';
import { IAppointmentRepository } from '../../domain/appointment/repository/appointment.repository.interface';
import { QueueNotificationService } from '../../domain/notification/service/queue-notification.service';

function createFakeQueueItemRepository(initialItems: IQueueItem[]) {
  const items = initialItems.map((item) => ({ ...item }));

  return {
    listQueueItems: jest.fn(async (filter: Partial<IQueueItem>) =>
      items
        .filter((item) => !filter.queueId || item.queueId === filter.queueId)
        .map((item) => ({ ...item })),
    ),
    getQueueItemById: jest.fn(async (id: string) => {
      const item = items.find((candidate) => candidate._id === id);
      return item ? { ...item } : null;
    }),
    updateQueueItemById: jest.fn(async (id: string, params: Partial<IQueueItem>) => {
      const item = items.find((candidate) => candidate._id === id);
      if (!item) return null;
      Object.assign(item, params);
      return { ...item };
    }),
    getNextWaitingQueueItem: jest.fn(async (queueId: string) => {
      const waiting = items
        .filter(
          (item) =>
            item.queueId === queueId && item.status === EQueueItemStatus.WAITING,
        )
        .sort((left, right) => left.position - right.position);
      return waiting[0] ? { ...waiting[0] } : null;
    }),
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
    getLastQueuePosition: jest.fn(async () => items.length),
    createQueueItem: jest.fn(),
    deleteQueueItemById: jest.fn(),
    getQueueItemsByPatientId: jest.fn(),
    getQueueItemByQueueId: jest.fn(),
    getQueueItemByProfessionalId: jest.fn(),
  } as unknown as IQueueItemRepository;
}

describe('QueueItemService position notifications', () => {
  it('notifies patients behind as soon as the doctor calls the person ahead of them, not only when they finish', async () => {
    const queueItems: IQueueItem[] = [
      {
        _id: 'qi-1',
        queueId: 'queue-1',
        patientId: 'patient-1',
        code: 'A1',
        position: 1,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
        missedCalls: 0,
      },
      {
        _id: 'qi-2',
        queueId: 'queue-1',
        patientId: 'patient-2',
        code: 'A2',
        position: 2,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
        missedCalls: 0,
      },
      {
        _id: 'qi-3',
        queueId: 'queue-1',
        patientId: 'patient-3',
        code: 'A3',
        position: 3,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
        missedCalls: 0,
      },
    ];

    const queueItemRepository = createFakeQueueItemRepository(queueItems);
    const queueRepository = {
      updateQueueById: jest.fn(),
    } as unknown as IQueueRepository;
    const appointmentRepository = {
      listAppointments: jest.fn().mockResolvedValue([]),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;

    const handleQueuePositionChange = jest.fn().mockResolvedValue(null);
    const queueNotificationService = {
      handleQueuePositionChange,
    } as unknown as QueueNotificationService;

    const service = new QueueItemService({
      queueItemRepository,
      queueRepository,
      appointmentRepository,
      queueNotificationService,
    });

    // Doctor calls the first patient: patient-3 (last in line) should move
    // from position 3 to position 2 right away and be notified.
    await service.callQueueItem('qi-1');

    expect(handleQueuePositionChange).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'qi-3', patientId: 'patient-3', position: 2 }),
    );

    handleQueuePositionChange.mockClear();

    // Doctor finishes the first patient: patient-3 should now move to
    // position 1 and be notified again.
    await service.finishQueueItem('qi-1');

    expect(handleQueuePositionChange).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'qi-3', patientId: 'patient-3', position: 1 }),
    );
  });
});
