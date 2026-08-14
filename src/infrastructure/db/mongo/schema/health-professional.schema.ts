import mongoose from 'mongoose';
import {
  EHealthProfessionalType,
  IHealthProfessionalSchedule,
} from '../../../../domain/health-professional.ts/interfaces/health-professional.interface';

const scheduleSchema = new mongoose.Schema(
  {
    appointmentDuration: {
      type: Number,
      required: true,
      default: 30,
    },

    morning: {
      start: {
        type: String,
      },
      end: {
        type: String,
      },
    },

    afternoon: {
      start: {
        type: String,
      },
      end: {
        type: String,
      },
    },
  },
  {
    _id: false,
  },
);

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

    type: {
      type: String,
      enum: Object.values(EHealthProfessionalType),
      default: EHealthProfessionalType.GENERAL,
    },

    room: {
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

    professionalLicense: {
      type: String,
      required: true,
      unique: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    avatar: {
      type: String,
      required: false,
    },

    schedule: {
      type: scheduleSchema,
      required: true,
      default: {
        appointmentDuration: 30,
      },
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
  name: string;
  email: string;
  room: string;
  password: string;
  schedule: IHealthProfessionalSchedule;
  professionalLicense: string;
  type: EHealthProfessionalType;
  active: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
