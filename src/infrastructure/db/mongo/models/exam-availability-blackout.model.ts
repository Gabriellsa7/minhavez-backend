import mongoose, { Model } from 'mongoose';
import {
  examAvailabilityBlackoutSchema,
  IExamAvailabilityBlackoutSchema,
} from '../schema/exam-availability-blackout.schema';

export const MExamAvailabilityBlackout: Model<IExamAvailabilityBlackoutSchema> =
  mongoose.model<IExamAvailabilityBlackoutSchema>(
    'examAvailabilityBlackout',
    examAvailabilityBlackoutSchema,
  );
