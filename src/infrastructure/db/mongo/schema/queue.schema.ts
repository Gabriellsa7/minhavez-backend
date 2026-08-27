import mongoose from 'mongoose';
import {
  EQueueShift,
  EQueueStatus,
} from '../../../../domain/queue/interfaces/queue.interface';

export const queueSchema = new mongoose.Schema(
  {
    professionalId: { type: String, required: true },
    healthUnitId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(EQueueStatus),
      required: true,
    },
    shift: {
      type: String,
      enum: Object.values(EQueueShift),
      required: true,
    },
    queueDate: {
      type: Date,
      required: true,
    },
    openedAt: { type: Date, required: false },
    closedAt: { type: Date, required: false },
    closeReason: { type: String, required: false },
  },
  { _id: true, timestamps: true },
);

export interface IQueueSchema {
  professionalId: string;
  healthUnitId: string;
  status: EQueueStatus;
  shift: EQueueShift;
  queueDate: Date;
  openedAt?: Date | null;
  closedAt?: Date | null;
  closeReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
