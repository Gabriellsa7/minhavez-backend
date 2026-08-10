import IORedis from 'ioredis';
import { QueueNotificationService } from '../../../domain/notification/service/queue-notification.service';
import { ENotificationType } from '../../../domain/notification/interfaces/notification.interface';
import { INotificationService } from '../../../domain/notification/interfaces/notification.service.interface';
import { IQueueRepository } from '../../../domain/queue/repository/queue.repository.interface';
import { EQueueShift, EQueueStatus, IQueue } from '../../../domain/queue/interfaces/queue.interface';
import {
  EQueueItemStatus,
  IQueueItem,
} from '../../../domain/queue-item/interfaces/queue-item.interface';

function createFakeRedisClient() {
  const store = new Set<string>();
  return {
    set: jest.fn(async (key: string) => {
      if (store.has(key)) return null;
      store.add(key);
      return 'OK';
    }),
  } as unknown as IORedis;
}

function createFakeQueueRepository(queueDate: Date) {
  return {
    getQueueById: jest.fn().mockResolvedValue({
      _id: 'queue-1',
      professionalId: 'professional-1',
      healthUnitId: 'health-unit-1',
      status: EQueueStatus.OPEN,
      shift: EQueueShift.MORNING,
      queueDate,
    } as IQueue),
  } as unknown as Pick<IQueueRepository, 'getQueueById'>;
}

describe('QueueNotificationService', () => {
  it('sends only one notification per threshold when the position is unchanged', async () => {
    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new QueueNotificationService({
      notificationService: { createNotification } as unknown as Pick<INotificationService, 'createNotification'>,
      queueRepository: createFakeQueueRepository(new Date()),
      redisClient: createFakeRedisClient(),
    });

    await service.handleQueuePositionChange({
      _id: 'queue-item-1',
      patientId: 'patient-1',
      queueId: 'queue-1',
      position: 10,
      status: EQueueItemStatus.WAITING,
    } as IQueueItem);

    await service.handleQueuePositionChange({
      _id: 'queue-item-1',
      patientId: 'patient-1',
      queueId: 'queue-1',
      position: 10,
      status: EQueueItemStatus.WAITING,
    } as IQueueItem);

    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'patient-1',
        type: ENotificationType.QUEUE_NEAR,
        title: 'Sua vez está chegando',
      }),
    );
  });

  it('does not send a position notification when the queue is not for today', async () => {
    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const service = new QueueNotificationService({
      notificationService: { createNotification } as unknown as Pick<INotificationService, 'createNotification'>,
      queueRepository: createFakeQueueRepository(tomorrow),
      redisClient: createFakeRedisClient(),
    });

    const result = await service.handleQueuePositionChange({
      _id: 'queue-item-1',
      patientId: 'patient-1',
      queueId: 'queue-1',
      position: 5,
      status: EQueueItemStatus.WAITING,
    } as IQueueItem);

    expect(result).toBeNull();
    expect(createNotification).not.toHaveBeenCalled();
  });
});
