import {
  EAppointmentStatus,
  IAppointment,
} from './interfaces/appointment.interface';

export class Appointment implements IAppointment {
  _id: string;

  healthUnitId: string;

  patientId: string;

  professionalId: string;

  queueItemId: string;

  status: EAppointmentStatus;

  notes?: string | undefined;

  dateTime: Date;

  createdAt: Date;

  finishedAt?: Date | null | undefined;

  updatedAt: Date;

  checkInAt?: Date | null | undefined;

  constructor(data: IAppointment) {
    this._id = data._id;
    this.healthUnitId = data.healthUnitId;
    this.patientId = data.patientId;
    this.professionalId = data.professionalId;
    this.queueItemId = data.queueItemId;
    this.status = data.status;
    this.dateTime = data.dateTime;
    this.finishedAt = data.finishedAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.checkInAt = data.checkInAt;
  }
}
