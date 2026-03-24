import mongoose from 'mongoose';
import { userSchema } from '../schema/user.schema';

export const MUser = mongoose.model('user', userSchema);
