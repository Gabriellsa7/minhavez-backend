import mongoose, { Model } from 'mongoose';
import {
  examSlotCounterSchema,
  IExamSlotCounterSchema,
} from '../schema/exam-slot-counter.schema';

export const MExamSlotCounter: Model<IExamSlotCounterSchema> =
  mongoose.model<IExamSlotCounterSchema>(
    'examSlotCounter',
    examSlotCounterSchema,
  );
