import mongoose from 'mongoose';
import { EPatientPriority } from '../../../../domain/patient/interfaces/patient.interface';
import { Types } from 'mongoose';

export const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    cpf: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Invalid CPF format'],
    },

    birthDate: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: Object.values(EPatientPriority),
      default: EPatientPriority.NORMAL,
    },

    phone: {
      type: String,
      required: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IPatientSchema {
  userId: Types.ObjectId;
  cpf: string;
  birthDate: string;
  priority: EPatientPriority;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}
