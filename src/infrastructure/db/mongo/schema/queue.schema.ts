import mongoose from 'mongoose';
import { EQueueStatus } from '../../../../domain/queue/interfaces/queue.interface';

export const queueSchema = new mongoose.Schema(
  {
    professionalId: { type: String, required: true },
    healthUnitId: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(EQueueStatus),
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
  openedAt?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
