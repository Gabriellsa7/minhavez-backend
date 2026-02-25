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
  },
  {
    timestamps: true,
  },
);

export interface IUserSchema {
  name: string;
  email: string;
  password: string;
  role: EUserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
