export enum EHealthProfessionalType {
  GENERAL = 'GENERAL',
  EXAM_PROFESSIONAL = 'EXAM_PROFESSIONAL',
}

export interface IHealthProfessional {
  _id: string;
  userId: string;
  healthUnitId: string;
  specialty: string;
  name: string;
  email: string;
  password: string;
  room: string;
  schedule: IHealthProfessionalSchedule;
  professionalLicense: string;
  type: EHealthProfessionalType;
  active: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHealthProfessionalSchedule {
  appointmentDuration: number;
  morning?: {
    start: string;
    end: string;
  };
  afternoon?: {
    start: string;
    end: string;
  };
}
