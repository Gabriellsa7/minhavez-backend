import mongoose, { Model } from 'mongoose';
import { IRatingSchema, ratingSchema } from '../schema/rating.schema';

export const MRating: Model<IRatingSchema> = mongoose.model<IRatingSchema>(
  'rating',
  ratingSchema,
);
