import {
  IParamsCreateNotification,
  IParamsUpdateNotification,
  INotificationRepository,
} from '../repository/notification.repository.interface';
import { INotification } from './notification.interface';

export interface IParamsNotificationService {
  notificationRepository: INotificationRepository;
}

export interface INotificationService {
  createNotification(params: IParamsCreateNotification): Promise<INotification>;
  getNotificationById(id: string): Promise<INotification | null>;
  listNotifications(filter: Partial<INotification>): Promise<INotification[]>;
  updateNotificationById(
    id: string,
    params: IParamsUpdateNotification,
  ): Promise<INotification | null>;
  deleteNotificationById(id: string): Promise<INotification | null>;
  markNotificationRead(id: string): Promise<INotification | null>;
}
