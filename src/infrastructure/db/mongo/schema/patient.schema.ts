import mongoose from 'mongoose';
import {
  ALLOWED_PATIENT_DOCUMENT_MIME_TYPES,
  EBloodType,
  EPatientPriority,
} from '../../../../domain/patient/interfaces/patient.interface';
import { Types } from 'mongoose';

const medicalDocumentSchema = new mongoose.Schema(
  {
    filePublicId: {
      type: String,
      required: true,
    },

    fileFormat: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
      enum: ALLOWED_PATIENT_DOCUMENT_MIME_TYPES,
    },

    fileSize: {
      type: Number,
      required: false,
    },

    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: true },
);

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

    bloodType: {
      type: String,
      enum: Object.values(EBloodType),
      required: false,
    },

    allergies: {
      type: String,
      required: false,
      trim: true,
    },

    medicalObservations: {
      type: String,
      required: false,
      trim: true,
    },

    medicalDocuments: {
      type: [medicalDocumentSchema],
      default: [],
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IPatientMedicalDocumentSchema {
  _id: Types.ObjectId;
  filePublicId: string;
  fileFormat: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  uploadedAt: Date;
}

export interface IPatientSchema {
  userId: Types.ObjectId;
  cpf: string;
  birthDate: string;
  priority: EPatientPriority;
  phone: string;
  bloodType?: EBloodType;
  allergies?: string;
  medicalObservations?: string;
  medicalDocuments: IPatientMedicalDocumentSchema[];
  createdAt: Date;
  updatedAt: Date;
}
