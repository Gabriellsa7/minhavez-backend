import { NotificationService } from '../../../domain/notification/service/notification.service';
import {
  ENotificationStatus,
  ENotificationType,
} from '../../../domain/notification/interfaces/notification.interface';
import { INotificationJobScheduler } from '../../../domain/notification/interfaces/notification-job-scheduler.interface';
import { INotificationRepository } from '../../../domain/notification/repository/notification.repository.interface';

describe('NotificationService', () => {
  it('queues notifications for background processing', async () => {
    const createNotification = jest.fn().mockResolvedValue({
      _id: 'notification-1',
      patientId: 'patient-1',
      title: 'Nova consulta',
      message: 'Sua consulta foi criada',
      type: ENotificationType.REMINDER,
      status: ENotificationStatus.PENDING,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const enqueue = jest.fn().mockResolvedValue(undefined);

    const service = new NotificationService({
      notificationRepository: { createNotification } as unknown as INotificationRepository,
      notificationJobScheduler: { enqueue } as unknown as INotificationJobScheduler,
    });

    const result = await service.createNotification({
      patientId: 'patient-1',
      title: 'Nova consulta',
      message: 'Sua consulta foi criada',
      type: ENotificationType.REMINDER,
    });

    expect(createNotification).toHaveBeenCalled();
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: 'notification-1',
        patientId: 'patient-1',
      }),
    );
    expect(result.status).toBe(ENotificationStatus.PENDING);
  });
});
