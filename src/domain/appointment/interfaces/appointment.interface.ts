export interface IAppointment {
  _id: string;
  patientId: string;
  professionalId: string;
  healthUnitId: string;
  queueItemId?: string | null;
  dateTime: Date;
  status: EAppointmentStatus;
  notes?: string;
  checkInAt?: Date | null;
  finishedAt?: Date | null;
  /** True when this appointment was created by the professional via "Marcar Retorno", instead of booked by the patient. */
  isReturn: boolean;
  /** True once a return has been scheduled for this appointment, allowing it to be finished. */
  returnScheduled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum EAppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}
