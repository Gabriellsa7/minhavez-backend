import mongoose, { Model } from 'mongoose';
import { IQueueItemSchema, queueItemSchema } from '../schema/queue-item.schema';

export const MQueueItem: Model<IQueueItemSchema> =
  mongoose.model<IQueueItemSchema>('queueItem', queueItemSchema);
