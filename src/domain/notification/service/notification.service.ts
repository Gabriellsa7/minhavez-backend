import { Logger } from 'traceability';
import {
  ENotificationStatus,
  ENotificationType,
  INotification,
} from '../interfaces/notification.interface';
import {
  IParamsCreateNotification,
  IParamsUpdateNotification,
  INotificationRepository,
} from '../repository/notification.repository.interface';
import {
  IParamsNotificationService,
  INotificationService,
} from '../interfaces/notification.service.interface';
import { INotificationProvider } from '../interfaces/notification-provider.interface';
import { INotificationJobScheduler } from '../interfaces/notification-job-scheduler.interface';
import { INotificationSocketGateway } from '../interfaces/notification-socket.interface';
import { notificationConfig } from '../../../infrastructure/config/notification.constants';

export class NotificationService implements INotificationService {
  private notificationRepository: INotificationRepository;
  private notificationProvider?: INotificationProvider;
  private notificationJobScheduler?: INotificationJobScheduler;
  private notificationSocketGateway?: INotificationSocketGateway;

  constructor(
    params: IParamsNotificationService & {
      notificationProvider?: INotificationProvider;
      notificationJobScheduler?: INotificationJobScheduler;
      notificationSocketGateway?: INotificationSocketGateway;
    },
  ) {
    this.notificationRepository = params.notificationRepository;
    this.notificationProvider = params.notificationProvider;
    this.notificationJobScheduler = params.notificationJobScheduler;
    this.notificationSocketGateway = params.notificationSocketGateway;
  }

  async createNotification(
    params: IParamsCreateNotification,
  ): Promise<INotification> {
    try {
      const notification = await this.notificationRepository.createNotification(
        {
          ...params,
          status: ENotificationStatus.PENDING,
          priority: params.priority ?? notificationConfig.priorities.default,
          scheduledAt: params.scheduledAt ?? new Date(),
        },
      );

      Logger.info('Notification created', {
        notificationId: notification._id,
        patientId: notification.patientId,
        status: notification.status,
      });

      this.notificationSocketGateway?.broadcastNotification({
        type: 'notification.created',
        notification,
      });

      if (this.notificationJobScheduler) {
        await this.notificationJobScheduler.enqueue({
          notificationId: notification._id,
          patientId: notification.patientId,
          metadata: {
            type: params.type ?? ENotificationType.REMINDER,
          },
        });
      } else if (this.notificationProvider) {
        await this.notificationProvider.send({
          to: notification.patientId,
          title: notification.title,
          body: notification.message,
        });
      }

      return notification;
    } catch (error) {
      throw new Error(
        `Error creating notification: ${(error as Error).message}`,
      );
    }
  }

  async processNotification(id: string): Promise<INotification | null> {
    const notification =
      await this.notificationRepository.getNotificationById(id);
    if (!notification) return null;

    await this.notificationRepository.updateNotificationById(id, {
      notificationData: {
        status: ENotificationStatus.PROCESSING,
        attempts: (notification.attempts ?? 0) + 1,
      },
    });

    try {
      if (this.notificationProvider) {
        await this.notificationProvider.send({
          to: notification.patientId,
          title: notification.title,
          body: notification.message,
        });
      }

      const updated = await this.notificationRepository.updateNotificationById(
        id,
        {
          notificationData: {
            status: ENotificationStatus.SENT,
            sentAt: new Date(),
            deliveredAt: new Date(),
            provider: 'expo',
            lastError: null,
          },
        },
      );

      Logger.info('Push delivered', {
        notificationId: id,
        patientId: notification.patientId,
      });
      this.notificationSocketGateway?.broadcastNotification({
        type: 'notification.delivered',
        notification: updated,
      });
      return updated;
    } catch (error) {
      const message = (error as Error).message;
      const attempts = (notification.attempts ?? 0) + 1;
      await this.notificationRepository.updateNotificationById(id, {
        notificationData: {
          status:
            attempts >= notificationConfig.retry.attempts
              ? ENotificationStatus.FAILED
              : ENotificationStatus.PENDING,
          lastError: message,
          attempts,
        },
      });
      Logger.error('Push failed', {
        notificationId: id,
        error: message,
        attempts,
      });
      throw error;
    }
  }

  async getNotificationById(id: string): Promise<INotification | null> {
    try {
      const notification =
        await this.notificationRepository.getNotificationById(id);
      if (!notification) {
        throw new Error('Notification not found');
      }
      return notification;
    } catch (error) {
      throw new Error(
        `Error retrieving notification by ID: ${(error as Error).message}`,
      );
    }
  }

  async listNotifications(
    filter: Partial<INotification>,
  ): Promise<INotification[]> {
    try {
      return await this.notificationRepository.listNotifications(filter);
    } catch (error) {
      throw new Error(
        `Error listing notifications: ${(error as Error).message}`,
      );
    }
  }

  async updateNotificationById(
    id: string,
    params: IParamsUpdateNotification,
  ): Promise<INotification | null> {
    try {
      const updated = await this.notificationRepository.updateNotificationById(
        id,
        params,
      );
      if (!updated) {
        throw new Error('Notification not found');
      }
      return updated;
    } catch (error) {
      throw new Error(
        `Error updating notification: ${(error as Error).message}`,
      );
    }
  }

  async deleteNotificationById(id: string): Promise<INotification | null> {
    try {
      const deleted =
        await this.notificationRepository.deleteNotificationById(id);
      if (!deleted) {
        throw new Error('Notification not found');
      }
      return deleted;
    } catch (error) {
      throw new Error(
        `Error deleting notification: ${(error as Error).message}`,
      );
    }
  }

  async markNotificationRead(id: string): Promise<INotification | null> {
    try {
      const updated =
        await this.notificationRepository.markNotificationRead(id);
      if (!updated) {
        throw new Error('Notification not found');
      }
      return updated;
    } catch (error) {
      throw new Error(
        `Error marking notification as read: ${(error as Error).message}`,
      );
    }
  }
}
