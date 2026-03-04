export interface IPatient {
  _id: string;
  userId: string;
  cpf: string;
  birthDate: string;
  priority: EPatientPriority;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum EPatientPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}
