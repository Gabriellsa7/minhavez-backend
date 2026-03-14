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

    position: {
      type: Number,
      required: true,
    },

    priority: {
      type: String,
      enum: Object.values(EQueueItemPriority),
      required: true,
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

export interface IQueueItemSchema {
  queueId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  position: number;
  priority: EQueueItemPriority;
  status: EQueueItemStatus;
  checkInTime?: Date;
  calledAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
