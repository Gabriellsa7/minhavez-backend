import mongoose from 'mongoose';

const prescriptionExamSchema = new mongoose.Schema(
  {
    examOfferingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'examOffering',
      required: true,
    },

    examOfferingName: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

export const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },

    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthProfessional',
      required: true,
    },

    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'healthUnit',
      required: true,
    },

    queueItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueItem',
      required: false,
    },

    medications: {
      type: String,
      required: false,
    },

    observations: {
      type: String,
      required: false,
    },

    exams: {
      type: [prescriptionExamSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) =>
          Array.isArray(value) && value.length > 0,
        message: 'At least one exam is required',
      },
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IPrescriptionExamSchema {
  examOfferingId: mongoose.Types.ObjectId;
  examOfferingName: string;
}

export interface IPrescriptionSchema {
  patientId: mongoose.Types.ObjectId;
  professionalId: mongoose.Types.ObjectId;
  healthUnitId: mongoose.Types.ObjectId;
  queueItemId?: mongoose.Types.ObjectId | null;
  medications?: string;
  observations?: string;
  exams: IPrescriptionExamSchema[];
  createdAt: Date;
  updatedAt: Date;
}
