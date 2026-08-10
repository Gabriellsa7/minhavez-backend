import {
  IHealthProfessional,
  IHealthProfessionalSchedule,
} from './interfaces/health-professional.interface';

export class HealthProfessional implements IHealthProfessional {
  _id: string;
  userId: string;
  healthUnitId: string;
  specialty: string;
  email: string;
  name: string;
  password: string;
  room: string;
  schedule: IHealthProfessionalSchedule;
  professionalLicense: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IHealthProfessional) {
    this._id = data._id;
    this.userId = data.userId;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.healthUnitId = data.healthUnitId;
    this.specialty = data.specialty;
    this.room = data.room;
    this.schedule = data.schedule;
    this.professionalLicense = data.professionalLicense;
    this.active = data.active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
