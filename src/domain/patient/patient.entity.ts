import {
  EBloodType,
  EPatientPriority,
  IPatient,
  IPatientMedicalDocument,
} from './interfaces/patient.interface';

export class Patient implements IPatient {
  _id: string;

  userId: string;

  cpf: string;

  birthDate: string;

  priority: EPatientPriority;

  phone: string;

  bloodType?: EBloodType;

  allergies?: string;

  medicalObservations?: string;

  medicalDocuments: IPatientMedicalDocument[];

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Patient) {
    this._id = data._id;
    this.userId = data.userId;
    this.cpf = data.cpf ?? data.cpf;
    this.birthDate = data.birthDate;
    this.priority = data.priority;
    this.phone = data.phone;
    this.bloodType = data.bloodType;
    this.allergies = data.allergies;
    this.medicalObservations = data.medicalObservations;
    this.medicalDocuments = data.medicalDocuments ?? [];
    this.createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : data.updatedAt;
  }
}
