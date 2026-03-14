import { INotification } from '../interfaces/notification.interface';
import {
  IParamsCreateNotification,
  IParamsUpdateNotification,
  INotificationRepository,
} from '../repository/notification.repository.interface';
import {
  IParamsNotificationService,
  INotificationService,
} from '../interfaces/notification.service.interface';

export class NotificationService implements INotificationService {
  private notificationRepository: INotificationRepository;

  constructor(params: IParamsNotificationService) {
    this.notificationRepository = params.notificationRepository;
  }

  async createNotification(
    params: IParamsCreateNotification,
  ): Promise<INotification> {
    try {
      return await this.notificationRepository.createNotification(params);
    } catch (error) {
      throw new Error(
        `Error creating notification: ${(error as Error).message}`,
      );
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
