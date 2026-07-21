import mongoose, { Model } from 'mongoose';
import {
  healthUnitSchema,
  IHealthUnitSchema,
} from '../schema/health-unit.schema';

export const MHealthUnit: Model<IHealthUnitSchema> =
  mongoose.model<IHealthUnitSchema>(
    'healthUnit',
    healthUnitSchema,
  );