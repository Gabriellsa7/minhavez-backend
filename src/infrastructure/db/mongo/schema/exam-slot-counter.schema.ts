import mongoose from 'mongoose';

export const examSlotCounterSchema = new mongoose.Schema(
  {
    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'healthUnit',
      required: true,
    },

    slotKey: {
      type: String,
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    bookedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

examSlotCounterSchema.index({ healthUnitId: 1, slotKey: 1 }, { unique: true });

export interface IExamSlotCounterSchema {
  healthUnitId: mongoose.Types.ObjectId;
  slotKey: string;
  capacity: number;
  bookedCount: number;
  createdAt: Date;
  updatedAt: Date;
}
