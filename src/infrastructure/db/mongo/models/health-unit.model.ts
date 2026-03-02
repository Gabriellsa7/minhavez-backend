import mongoose from 'mongoose';
import { healthUnitSchema } from '../schema/health-unit.schema';

export const Muser = mongoose.model('healthUnit', healthUnitSchema);
