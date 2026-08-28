import mongoose, { Model } from 'mongoose';
import {
  receptionistSchema,
  IReceptionistSchema,
} from '../schema/receptionist.schema';

export const MReceptionist: Model<IReceptionistSchema> =
  mongoose.model<IReceptionistSchema>('receptionist', receptionistSchema);
