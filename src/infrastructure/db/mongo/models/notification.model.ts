import mongoose, { Model } from 'mongoose';
import {
  INotificationSchema,
  notificationSchema,
} from '../schema/notification.schema';

export const MNotification: Model<INotificationSchema> =
  mongoose.model<INotificationSchema>('notification', notificationSchema);
