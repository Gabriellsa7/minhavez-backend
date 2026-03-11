import mongoose from 'mongoose';
import { queueSchema } from '../schema/queue.schema';

export const Muser = mongoose.model('queue', queueSchema);
