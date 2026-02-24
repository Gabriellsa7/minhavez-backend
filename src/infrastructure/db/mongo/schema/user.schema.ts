import mongoose from 'mongoose';

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
      enum: ['ADMIN', 'USER', 'PROFISSIONAL'],
      default: 'USER',
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

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER' | 'PROFISSIONAL';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
