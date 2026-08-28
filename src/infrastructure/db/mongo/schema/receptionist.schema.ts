import mongoose from 'mongoose';

export const receptionistSchema = new mongoose.Schema(
  {
    healthUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthUnit',
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

    active: {
      type: Boolean,
      default: true,
    },

    avatar: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IReceptionistSchema {
  healthUnitId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  active: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
