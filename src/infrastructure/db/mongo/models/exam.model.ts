import mongoose, { Model } from 'mongoose';
import { examSchema, IExamSchema } from '../schema/exam.schema';

export const MExam: Model<IExamSchema> = mongoose.model<IExamSchema>(
  'exam',
  examSchema,
);
