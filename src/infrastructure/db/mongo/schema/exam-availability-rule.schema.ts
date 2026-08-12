import mongoose from 'mongoose';
import { WeekDay } from '../../../../domain/health-unit/interfaces/health-unit.interface';

export const examAvailabilityRuleSchema = new mongoose.Schema(
  {
    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'healthUnit',
      required: true,
      index: true,
    },

    weekday: {
      type: String,
      enum: Object.values(WeekDay),
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    slotDurationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    capacityPerSlot: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

examAvailabilityRuleSchema.index({ healthUnitId: 1, weekday: 1 });

export interface IExamAvailabilityRuleSchema {
  healthUnitId: mongoose.Types.ObjectId;
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacityPerSlot: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
