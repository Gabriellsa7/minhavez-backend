import mongoose, { Model } from 'mongoose';
import {
  examOfferingSchema,
  IExamOfferingSchema,
} from '../schema/exam-offering.schema';

export const MExamOffering: Model<IExamOfferingSchema> =
  mongoose.model<IExamOfferingSchema>('examOffering', examOfferingSchema);
