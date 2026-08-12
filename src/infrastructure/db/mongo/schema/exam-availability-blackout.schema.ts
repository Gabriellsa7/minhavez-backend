import mongoose from 'mongoose';

export const examAvailabilityBlackoutSchema = new mongoose.Schema(
  {
    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'healthUnit',
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

examAvailabilityBlackoutSchema.index(
  { healthUnitId: 1, date: 1 },
  { unique: true },
);

export interface IExamAvailabilityBlackoutSchema {
  healthUnitId: mongoose.Types.ObjectId;
  date: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}
