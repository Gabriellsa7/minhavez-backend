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
      notificationRepository: {
        createNotification,
      } as unknown as INotificationRepository,
      notificationJobScheduler: {
        enqueue,
      } as unknown as INotificationJobScheduler,
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

  it('hides reminders that are not due yet and cancelled ones from the patient inbox', async () => {
    const now = Date.now();
    const notification = (
      _id: string,
      status: ENotificationStatus,
      scheduledAt?: Date,
    ) => ({ _id, status, scheduledAt, patientId: 'patient-1', read: false });
    const listNotifications = jest
      .fn()
      .mockResolvedValue([
        notification('sent', ENotificationStatus.DELIVERED),
        notification('due', ENotificationStatus.PENDING, new Date(now - 1000)),
        notification(
          'future',
          ENotificationStatus.PENDING,
          new Date(now + 60 * 60 * 1000),
        ),
        notification('cancelled', ENotificationStatus.CANCELLED),
      ]);

    const service = new NotificationService({
      notificationRepository: {
        listNotifications,
      } as unknown as INotificationRepository,
    });

    const inbox = await service.listPatientInbox('patient-1', {
      onlyUnread: true,
    });

    expect(listNotifications).toHaveBeenCalledWith({
      patientId: 'patient-1',
      read: false,
    });
    expect(inbox.map((item) => item._id)).toEqual(['sent', 'due']);
  });

  it('does not send a notification that was cancelled', async () => {
    const getNotificationById = jest.fn().mockResolvedValue({
      _id: 'notification-1',
      status: ENotificationStatus.CANCELLED,
    });
    const updateNotificationById = jest.fn();

    const service = new NotificationService({
      notificationRepository: {
        getNotificationById,
        updateNotificationById,
      } as unknown as INotificationRepository,
    });

    await service.processNotification('notification-1');

    expect(updateNotificationById).not.toHaveBeenCalled();
  });
});
