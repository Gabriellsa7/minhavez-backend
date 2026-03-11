import mongoose from 'mongoose';
import {
  EQueueStatus,
  EQueueType,
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
    type: {
      type: String,
      enum: Object.values(EQueueType),
      required: true,
    },
    openedAt: { type: Date, required: false },
    closedAt: { type: Date, required: false },
  },
  { _id: true, timestamps: true },
);

export interface IQueueSchema {
  professionalId: string;
  healthUnitId: string;
  status: EQueueStatus;
  type: EQueueType;
  openedAt?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
