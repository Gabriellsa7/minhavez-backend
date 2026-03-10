import { IHealthProfessional } from './interfaces/health-professional.interface';

export class HealthProfessional implements IHealthProfessional {
  _id: string;
  userId: string;
  healthUnitId: string;
  specialty: string;
  professionalLicense: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IHealthProfessional) {
    this._id = data._id;
    this.userId = data.userId;
    this.healthUnitId = data.healthUnitId;
    this.specialty = data.specialty;
    this.professionalLicense = data.professionalLicense;
    this.active = data.active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
