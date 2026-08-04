import mongoose from 'mongoose';
import { EUserRole } from '../../../../domain/user/interfaces/user.interface';

export const userSchema = new mongoose.Schema(
  {
    name: {
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

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: EUserRole,
      default: EUserRole.USER,
    },

    active: {
      type: Boolean,
      default: true,
    },

    devices: {
      type: [
        {
          token: { type: String, required: true },
          platform: { type: String, default: 'unknown' },
          model: { type: String, default: 'unknown' },
          lastSeen: { type: Date, default: Date.now },
          enabled: { type: Boolean, default: true },
          lastUsed: { type: Date, default: Date.now },
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IUserSchema {
  name: string;
  email: string;
  password: string;
  role: EUserRole;
  active: boolean;
  devices: Array<{
    token: string;
    platform: string;
    model?: string;
    lastSeen?: Date;
    enabled?: boolean;
    lastUsed: Date;
    createdAt: Date;
    updatedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
