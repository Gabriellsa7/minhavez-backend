import mongoose from 'mongoose';
import { healthUnitSchema } from '../schema/health-unit.schema';

export const MHealthUnit = mongoose.model('healthUnit', healthUnitSchema);
