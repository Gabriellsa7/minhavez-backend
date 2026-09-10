import mongoose from 'mongoose';
import {
  EQueueItemPriority,
  EQueueItemStatus,
} from '../../../../domain/queue-item/interfaces/queue-item.interface';

export const queueItemSchema = new mongoose.Schema(
  {
    queueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    position: {
      type: Number,
      required: false,
      default: null,
    },

    priority: {
      type: String,
      enum: Object.values(EQueueItemPriority),
      required: true,
    },

    scheduledDateTime: {
      type: Date,
      required: true,
    },

    isWalkIn: {
      type: Boolean,
      default: false,
    },

    positionRevealedAt: {
      type: Date,
      required: false,
      default: null,
    },

    missedCalls: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: Object.values(EQueueItemStatus),
      required: true,
    },

    checkInTime: {
      type: Date,
      required: false,
    },

    calledAt: {
      type: Date,
      required: false,
    },

    finishedAt: {
      type: Date,
      required: false,
    },
  },
  { _id: true, timestamps: true },
);

queueItemSchema.index({ queueId: 1, code: 1 }, { unique: true });
queueItemSchema.index({ queueId: 1, status: 1, scheduledDateTime: 1 });
queueItemSchema.index({ status: 1, position: 1, scheduledDateTime: 1 });

export interface IQueueItemSchema {
  queueId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  position: number | null;
  priority: EQueueItemPriority;
  scheduledDateTime: Date;
  isWalkIn: boolean;
  positionRevealedAt?: Date | null;
  missedCalls: number;
  room: string;
  status: EQueueItemStatus;
  code: string;
  checkInTime?: Date;
  calledAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
