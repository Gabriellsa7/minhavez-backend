import mongoose from 'mongoose';
import {
  EExamBookingCanceledBy,
  EExamBookingStatus,
} from '../../../../domain/exam-booking/interfaces/exam-booking.interface';

export const examBookingSchema = new mongoose.Schema(
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

    examOfferingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'examOffering',
      required: true,
      index: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
    },

    priceSnapshot: {
      type: Number,
      required: false,
    },

    status: {
      type: String,
      enum: Object.values(EExamBookingStatus),
      default: EExamBookingStatus.SCHEDULED,
    },

    slotKey: {
      type: String,
      required: true,
    },

    resultExamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'exam',
      required: false,
      default: null,
    },

    canceledAt: {
      type: Date,
      required: false,
      default: null,
    },

    canceledBy: {
      type: String,
      enum: Object.values(EExamBookingCanceledBy),
      required: false,
      default: null,
    },

    cancelReason: {
      type: String,
      required: false,
      default: null,
    },

    notes: {
      type: String,
      required: false,
    },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

examBookingSchema.index({ patientId: 1, status: 1 });
examBookingSchema.index({ healthUnitId: 1, scheduledAt: 1 });

export interface IExamBookingSchema {
  patientId: mongoose.Types.ObjectId;
  healthUnitId: mongoose.Types.ObjectId;
  examOfferingId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  priceSnapshot?: number;
  status: EExamBookingStatus;
  slotKey: string;
  resultExamId?: mongoose.Types.ObjectId | null;
  canceledAt?: Date | null;
  canceledBy?: EExamBookingCanceledBy | null;
  cancelReason?: string | null;
  notes?: string;
  createdByUserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
