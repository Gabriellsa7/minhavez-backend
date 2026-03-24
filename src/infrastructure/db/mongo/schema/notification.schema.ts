import mongoose from 'mongoose';
import { ENotificationType } from '../../../../domain/notification/interfaces/notification.interface';

export const notificationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    queueItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueItem',
      required: false,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      require: false,
    },
    type: {
      type: String,
      enum: ENotificationType,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      required: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface INotificationSchema {
  patientId: mongoose.Types.ObjectId;
  queueItemId: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  title: string;
  type: ENotificationType;
  message: string;
  read: boolean;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
