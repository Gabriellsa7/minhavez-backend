import mongoose from 'mongoose';

export const ratingSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
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
    professionalStars: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    professionalComment: {
      type: String,
      required: false,
    },
    clinicStars: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },
    clinicComment: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IRatingSchema {
  appointmentId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  professionalId: mongoose.Types.ObjectId;
  healthUnitId: mongoose.Types.ObjectId;
  professionalStars?: number;
  professionalComment?: string;
  clinicStars?: number;
  clinicComment?: string;
  createdAt: Date;
  updatedAt: Date;
}
