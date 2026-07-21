import mongoose from 'mongoose';

export const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: false,
      trim: true,
    },

    duration: {
      type: Number,
      required: false,
      min: 0,
    },

    price: {
      type: Number,
      required: false,
      min: 0,
    },
  },
  {
    _id: true,
    timestamps: true,
  },
);

export interface IServiceSchema {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  duration?: number;
  price?: number;
  createdAt?: Date;
  updatedAt?: Date;
}