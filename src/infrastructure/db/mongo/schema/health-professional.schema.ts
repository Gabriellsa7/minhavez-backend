import mongoose from 'mongoose';

export const healthProfessionalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthUnit',
      required: true,
    },

    specialty: {
      type: String,
      required: true,
    },

    professionalLicense: {
      type: String,
      required: true,
      unique: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IHealthProfessionalSchema {
  userId: mongoose.Types.ObjectId;
  healthUnitId: mongoose.Types.ObjectId;
  specialty: string;
  professionalLicense: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
