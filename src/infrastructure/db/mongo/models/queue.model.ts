import mongoose from 'mongoose';
import { queueSchema } from '../schema/queue.schema';

export const MQueue = mongoose.model('queue', queueSchema);
