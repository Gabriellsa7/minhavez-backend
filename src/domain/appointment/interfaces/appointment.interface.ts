export interface IAppointment {
  _id: string;
  patientId: string;
  professionalId: string;
  healthUnitId: string;
  dateTime: Date;
  status: EAppointmentStatus;
  notes?: string;
  checkInAt?: Date | null;
  finishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum EAppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}
