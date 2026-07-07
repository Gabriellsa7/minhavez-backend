import mongoose from 'mongoose';

export const healthProfessionalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
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

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    
    isDoctor: {
      type: Boolean,
      required: true,
      default: true,
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
  userId?: mongoose.Types.ObjectId;
  healthUnitId: mongoose.Types.ObjectId;
  isDoctor: boolean;
  specialty: string;
  name: string;
  email: string;
  password: string;
  professionalLicense: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
