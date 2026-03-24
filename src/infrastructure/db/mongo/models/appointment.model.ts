import mongoose, { Model } from 'mongoose';
import {
  IAppointmentSchema,
  appointmentSchema,
} from '../schema/appointment.schema';

export const MAppointment: Model<IAppointmentSchema> =
  mongoose.model<IAppointmentSchema>('appointment', appointmentSchema);
