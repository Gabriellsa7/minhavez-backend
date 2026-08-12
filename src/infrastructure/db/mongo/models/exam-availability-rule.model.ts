import mongoose, { Model } from 'mongoose';
import {
  examAvailabilityRuleSchema,
  IExamAvailabilityRuleSchema,
} from '../schema/exam-availability-rule.schema';

export const MExamAvailabilityRule: Model<IExamAvailabilityRuleSchema> =
  mongoose.model<IExamAvailabilityRuleSchema>(
    'examAvailabilityRule',
    examAvailabilityRuleSchema,
  );
