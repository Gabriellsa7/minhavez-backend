import mongoose from 'mongoose';
import { EAppointmentStatus } from '../../../../domain/appointment/interfaces/appointment.interface';

export const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthProfessional',
      required: true,
    },
    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthUnit',
      required: true,
    },
    queueItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueItem',
      required: false,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EAppointmentStatus),
      default: EAppointmentStatus.SCHEDULED,
    },
    notes: {
      type: String,
      required: false,
    },
    checkInAt: {
      type: Date,
      required: false,
    },
    checkInReminderSentAt: {
      type: Date,
      required: false,
    },
    finishedAt: {
      type: Date,
      required: false,
    },
    isReturn: {
      type: Boolean,
      default: false,
    },
    returnScheduled: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

// Atomic guard against double-booking: only one active appointment per
// professional and slot. Canceled/finished appointments free the slot.
export const ACTIVE_APPOINTMENT_STATUSES = [
  EAppointmentStatus.SCHEDULED,
  EAppointmentStatus.IN_PROGRESS,
];

appointmentSchema.index(
  { professionalId: 1, dateTime: 1 },
  {
    unique: true,
    name: 'uniq_active_professional_slot',
    partialFilterExpression: { status: { $in: ACTIVE_APPOINTMENT_STATUSES } },
  },
);

export interface IAppointmentSchema {
  patientId: mongoose.Types.ObjectId;
  professionalId: mongoose.Types.ObjectId;
  healthUnitId: mongoose.Types.ObjectId;
  queueItemId?: mongoose.Types.ObjectId | null;
  dateTime: Date;
  status: EAppointmentStatus;
  notes?: string;
  checkInAt?: Date | null;
  checkInReminderSentAt?: Date | null;
  finishedAt?: Date | null;
  isReturn: boolean;
  returnScheduled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
