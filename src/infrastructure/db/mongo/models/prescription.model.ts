import mongoose, { Model } from 'mongoose';
import {
  prescriptionSchema,
  IPrescriptionSchema,
} from '../schema/prescription.schema';

export const MPrescription: Model<IPrescriptionSchema> =
  mongoose.model<IPrescriptionSchema>('prescription', prescriptionSchema);
