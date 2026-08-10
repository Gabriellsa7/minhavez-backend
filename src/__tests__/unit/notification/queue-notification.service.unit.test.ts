import IORedis from 'ioredis';
import { QueueNotificationService } from '../../../domain/notification/service/queue-notification.service';
import { ENotificationType } from '../../../domain/notification/interfaces/notification.interface';
import { INotificationService } from '../../../domain/notification/interfaces/notification.service.interface';
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

describe('QueueNotificationService', () => {
  it('sends only one notification per threshold when the position is unchanged', async () => {
    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new QueueNotificationService({
      notificationService: { createNotification } as unknown as Pick<INotificationService, 'createNotification'>,
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
});
