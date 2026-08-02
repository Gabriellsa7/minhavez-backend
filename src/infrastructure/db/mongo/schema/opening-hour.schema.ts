import mongoose from 'mongoose';
import { WeekDay } from '../../../../domain/health-unit/interfaces/health-unit.interface';

export const openingHourSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: Object.values(WeekDay),
      required: true,
    },

    open: {
      type: String,
      required: false,
    },

    close: {
      type: String,
      required: false,
    },

    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

export interface IOpeningHourSchema {
  day: WeekDay;
  open?: string;
  close?: string;
  isClosed: boolean;
}
