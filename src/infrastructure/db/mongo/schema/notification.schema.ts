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
    status: {
      type: String,
      default: 'PENDING',
    },
    provider: {
      type: String,
      default: 'expo',
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastError: {
      type: String,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
    deliveredAt: {
      type: Date,
      required: false,
    },
    deviceToken: {
      type: String,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    priority: {
      type: Number,
      default: 3,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    scheduledAt: {
      type: Date,
      required: false,
    },
    sentAt: {
      type: Date,
      required: false,
    },
    readAt: {
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
  queueItemId?: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  title: string;
  type: ENotificationType;
  message: string;
  read: boolean;
  status?: string;
  provider?: string;
  providerResponse?: Record<string, unknown>;
  lastError?: string | null;
  attempts?: number;
  expiresAt?: Date | null;
  deliveredAt?: Date | null;
  deviceToken?: string | null;
  metadata?: Record<string, unknown>;
  priority?: number;
  data?: Record<string, unknown>;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
