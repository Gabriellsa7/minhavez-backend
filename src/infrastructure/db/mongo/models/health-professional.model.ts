import mongoose, { Model } from 'mongoose';
import {
  healthProfessionalSchema,
  IHealthProfessionalSchema,
} from '../schema/health-professional.schema';

export const MHealthProfessional: Model<IHealthProfessionalSchema> =
  mongoose.model<IHealthProfessionalSchema>(
    'healthProfessional',
    healthProfessionalSchema,
  );
