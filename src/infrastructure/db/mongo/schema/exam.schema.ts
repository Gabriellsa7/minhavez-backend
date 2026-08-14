import mongoose, { Types } from 'mongoose';
import { ALLOWED_EXAM_MIME_TYPE } from '../../../../domain/exam/interfaces/exam.interface';

export const examSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'patient',
      required: true,
      index: true,
    },

    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'healthUnit',
      required: true,
      index: true,
    },

    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    examType: {
      type: String,
      required: true,
      trim: true,
    },

    examDate: {
      type: Date,
      required: false,
    },

    doctorName: {
      type: String,
      required: false,
      trim: true,
    },

    notes: {
      type: String,
      required: false,
    },

    filePublicId: {
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
      enum: [ALLOWED_EXAM_MIME_TYPE],
    },

    fileSize: {
      type: Number,
      required: false,
    },

    examBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'examBooking',
      required: false,
      default: null,
    },

    downloadCount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IExamSchema {
  patientId: Types.ObjectId;
  healthUnitId: Types.ObjectId;
  uploadedByUserId: Types.ObjectId;
  examType: string;
  examDate?: Date | null;
  doctorName?: string;
  notes?: string;
  filePublicId: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  examBookingId?: Types.ObjectId | null;
  downloadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
