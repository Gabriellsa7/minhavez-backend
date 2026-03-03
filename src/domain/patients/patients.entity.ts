import { EPatientPriority } from './interfaces/patients.interface';

export class Patient {
  _id: string;

  userId: string;

  cpf: string;

  birthDate: string;

  priority: EPatientPriority;

  phone: string;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Patient) {
    this._id = data._id;
    this.userId = data.userId;
    this.cpf = data.cpf ?? data.cpf;
    this.birthDate = data.birthDate;
    this.priority = data.priority;
    this.phone = data.phone;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : data.updatedAt;
  }
}
