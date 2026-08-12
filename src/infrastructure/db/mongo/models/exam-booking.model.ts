import mongoose, { Model } from 'mongoose';
import {
  examBookingSchema,
  IExamBookingSchema,
} from '../schema/exam-booking.schema';

export const MExamBooking: Model<IExamBookingSchema> =
  mongoose.model<IExamBookingSchema>('examBooking', examBookingSchema);
