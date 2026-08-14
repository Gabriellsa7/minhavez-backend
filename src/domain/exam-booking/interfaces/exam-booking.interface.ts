export enum EExamBookingStatus {
  SCHEDULED = 'SCHEDULED',
  /** Reserved for a future "patient/clinic confirms attendance" step — not used by any transition in v1. */
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  NO_SHOW = 'NO_SHOW',
}

export enum EExamBookingCanceledBy {
  PATIENT = 'PATIENT',
  STAFF = 'STAFF',
}

export interface IExamBooking {
  _id: string;
  patientId: string;
  healthUnitId: string;
  examOfferingId: string;
  scheduledAt: Date;
  durationMinutes: number;
  priceSnapshot?: number;
  status: EExamBookingStatus;
  slotKey: string;
  resultExamId?: string | null;
  canceledAt?: Date | null;
  canceledBy?: EExamBookingCanceledBy | null;
  cancelReason?: string | null;
  notes?: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** True operational statuses a booking's `resultExamId`-derived label can be computed from. */
export function isResultAvailable(booking: IExamBooking): boolean {
  return (
    booking.status === EExamBookingStatus.COMPLETED &&
    !!booking.resultExamId
  );
}

export interface IExamBookingWithContext extends IExamBooking {
  examOfferingName: string;
  healthUnitName: string;
  patientName: string;
  patientCpf: string;
}
