import { INotification } from '../interfaces/notification.interface';

export interface IParamsCreateNotification {
  patientId: string;
  title: string;
  message: string;
}

export interface IParamsUpdateNotification {
  notificationData: Partial<INotification>;
}

export interface INotificationRepository {
  createNotification(
    notificationData: IParamsCreateNotification,
  ): Promise<INotification>;
  updateNotificationById(
    id: string,
    params: IParamsUpdateNotification,
  ): Promise<INotification | null>;
  deleteNotificationById(id: string): Promise<INotification | null>;
  getNotificationById(id: string): Promise<INotification | null>;
  listNotifications(filter: Partial<INotification>): Promise<INotification[]>;
  markNotificationRead(id: string): Promise<INotification | null>;
}
