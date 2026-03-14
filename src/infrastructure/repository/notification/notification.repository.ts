import { HydratedDocument } from 'mongoose';
import { INotification } from '../../../domain/notification/interfaces/notification.interface';
import { INotificationSchema } from '../../db/mongo/schema/notification.schema';
import {
  IParamsCreateNotification,
  IParamsUpdateNotification,
  INotificationRepository,
} from '../../../domain/notification/repository/notification.repository.interface';
import { Muser } from '../../db/mongo/models/notification.model';

export class NotificationRepository implements INotificationRepository {
  private mapToDomain(
    notificationDoc: HydratedDocument<INotificationSchema>,
  ): INotification {
    return {
      _id: notificationDoc._id.toString(),
      patientId: notificationDoc.patientId.toString(),
      title: notificationDoc.title,
      message: notificationDoc.message,
      read: notificationDoc.read,
      sentAt: notificationDoc.sentAt,
      createdAt: notificationDoc.createdAt,
      updatedAt: notificationDoc.updatedAt,
    };
  }

  async createNotification(
    notificationData: IParamsCreateNotification,
  ): Promise<INotification> {
    try {
      const notificationDoc = await Muser.create(notificationData);
      return this.mapToDomain(notificationDoc);
    } catch (error) {
      throw new Error(
        `Error creating notification: ${(error as Error).message}`,
      );
    }
  }

  async updateNotificationById(
    id: string,
    params: IParamsUpdateNotification,
  ): Promise<INotification | null> {
    try {
      const notificationDoc = await Muser.findByIdAndUpdate(id, params, {
        new: true,
      });

      if (!notificationDoc) return null;

      return this.mapToDomain(notificationDoc);
    } catch (error) {
      throw new Error(
        `Error updating notification by ID: ${(error as Error).message}`,
      );
    }
  }

  async deleteNotificationById(id: string): Promise<INotification | null> {
    try {
      const notificationDoc = await Muser.findByIdAndDelete(id);
      if (!notificationDoc) return null;

      return this.mapToDomain(notificationDoc);
    } catch (error) {
      throw new Error(
        `Error deleting notification by ID: ${(error as Error).message}`,
      );
    }
  }

  async getNotificationById(id: string): Promise<INotification | null> {
    try {
      const notificationDoc = await Muser.findById(id);
      if (!notificationDoc) return null;

      return this.mapToDomain(notificationDoc);
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
      const notificationDocs = await Muser.find(filter);
      return notificationDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing notifications: ${(error as Error).message}`,
      );
    }
  }

  async markNotificationRead(id: string): Promise<INotification | null> {
    try {
      const notificationDoc = await Muser.findByIdAndUpdate(
        id,
        { read: true },
        { new: true },
      );
      if (!notificationDoc) return null;

      return this.mapToDomain(notificationDoc);
    } catch (error) {
      throw new Error(
        `Error marking notification as read: ${(error as Error).message}`,
      );
    }
  }
}
