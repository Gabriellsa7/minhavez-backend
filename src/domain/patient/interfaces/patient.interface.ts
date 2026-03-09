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
  NORMAL = 'NORMAL',
  ELDERLY = 'ELDERLY',
  PREGNANT = 'PREGNANT',
  DISABLED = 'DISABLED',
}
