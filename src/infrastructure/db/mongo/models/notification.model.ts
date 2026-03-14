import mongoose, { Model } from 'mongoose';
import {
  INotificationSchema,
  notificationSchema,
} from '../schema/notification.schema';

export const Muser: Model<INotificationSchema> =
  mongoose.model<INotificationSchema>('notification', notificationSchema);
