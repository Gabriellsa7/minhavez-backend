import {
  EExamBookingCanceledBy,
  EExamBookingStatus,
  IExamBooking,
} from '../interfaces/exam-booking.interface';

export interface IParamsCreateExamBooking {
  patientId: string;
  healthUnitId: string;
  examOfferingId: string;
  scheduledAt: Date;
  durationMinutes: number;
  priceSnapshot?: number;
  slotKey: string;
  createdByUserId: string;
  notes?: string;
}

export interface IParamsUpdateExamBooking {
  status?: EExamBookingStatus;
  resultExamId?: string | null;
  canceledAt?: Date | null;
  canceledBy?: EExamBookingCanceledBy | null;
  cancelReason?: string | null;
}

export interface IListExamBookingsByHealthUnitFilter {
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  status?: EExamBookingStatus;
}

export interface IExamBookingRepository {
  /**
   * Atomically reserves one seat in the (healthUnitId, slotKey) bucket, creating the
   * counter document on first use. Returns false when the slot is already at capacity —
   * callers must treat that as "slot full", not retry indefinitely.
   */
  reserveSlot(
    healthUnitId: string,
    slotKey: string,
    capacity: number,
  ): Promise<boolean>;
  releaseSlot(healthUnitId: string, slotKey: string): Promise<void>;
  getBookedCountsForSlots(
    healthUnitId: string,
    slotKeys: string[],
  ): Promise<Map<string, { bookedCount: number; capacity: number }>>;
  createExamBooking(data: IParamsCreateExamBooking): Promise<IExamBooking>;
  getExamBookingById(id: string): Promise<IExamBooking | null>;
  updateExamBookingById(
    id: string,
    params: IParamsUpdateExamBooking,
  ): Promise<IExamBooking | null>;
  listExamBookingsByPatientId(patientId: string): Promise<IExamBooking[]>;
  listExamBookingsByHealthUnitId(
    healthUnitId: string,
    filter: IListExamBookingsByHealthUnitFilter,
  ): Promise<IExamBooking[]>;
}
