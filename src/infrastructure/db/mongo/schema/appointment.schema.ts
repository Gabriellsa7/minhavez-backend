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
      required: true,
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
    finishedAt: {
      type: Date,
      required: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IAppointmentSchema {
  patientId: mongoose.Types.ObjectId;
  professionalId: mongoose.Types.ObjectId;
  healthUnitId: mongoose.Types.ObjectId;
  queueItemId: mongoose.Types.ObjectId;
  dateTime: Date;
  status: EAppointmentStatus;
  notes?: string;
  checkInAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
