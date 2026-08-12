import mongoose from 'mongoose';

export const examOfferingSchema = new mongoose.Schema(
  {
    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'healthUnit',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      required: false,
      trim: true,
    },

    description: {
      type: String,
      required: false,
    },

    category: {
      type: String,
      required: false,
      trim: true,
    },

    sampleType: {
      type: String,
      required: false,
      trim: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    resultTurnaroundEstimate: {
      type: String,
      required: false,
    },

    requiresPreparation: {
      type: Boolean,
      default: false,
    },

    preparationInstructions: {
      type: String,
      required: false,
    },

    requiresFasting: {
      type: Boolean,
      default: false,
    },

    fastingHours: {
      type: Number,
      required: false,
      min: 0,
    },

    price: {
      type: Number,
      required: false,
      min: 0,
    },

    acceptedInsurances: {
      type: [String],
      default: [],
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

examOfferingSchema.index({ healthUnitId: 1, isActive: 1 });

export interface IExamOfferingSchema {
  healthUnitId: mongoose.Types.ObjectId;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  sampleType?: string;
  durationMinutes: number;
  resultTurnaroundEstimate?: string;
  requiresPreparation: boolean;
  preparationInstructions?: string;
  requiresFasting: boolean;
  fastingHours?: number;
  price?: number;
  acceptedInsurances: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
