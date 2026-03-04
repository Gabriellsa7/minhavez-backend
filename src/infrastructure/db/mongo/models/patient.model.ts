import mongoose, { Model } from 'mongoose';
import { IPatientSchema, patientSchema } from '../schema/patient.schema';

export const Muser: Model<IPatientSchema> = mongoose.model<IPatientSchema>(
  'patient',
  patientSchema,
);
