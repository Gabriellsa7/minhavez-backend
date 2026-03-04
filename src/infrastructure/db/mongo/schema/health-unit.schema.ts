import mongoose from 'mongoose';
import { IHealthUnitAddress } from '../../../../domain/health-unit/interfaces/health-unit.interface';

export const healthUnitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: Object,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email'],
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IHealthUnitSchema {
  name: string;
  address: IHealthUnitAddress;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
