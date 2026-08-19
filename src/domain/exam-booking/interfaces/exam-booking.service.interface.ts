import { IExamOfferingRepository } from '../../exam-offering/repository/exam-offering.repository.interface';
import { IExamAvailabilityRepository } from '../../exam-availability/repository/exam-availability.repository.interface';
import { IPatientRepository } from '../../patient/repository/patient.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IExamRepository } from '../../exam/repository/exam.repository.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import { IExamBookingRepository } from '../repository/exam-booking.repository.interface';
import {
  EExamBookingStatus,
  IExamBookingWithContext,
} from './exam-booking.interface';
import { IPaginationParams } from '../../../shared/utils/pagination';

export interface IParamsExamBookingService {
  examBookingRepository: IExamBookingRepository;
  examOfferingRepository: IExamOfferingRepository;
  examAvailabilityRepository: IExamAvailabilityRepository;
  patientRepository: IPatientRepository;
  healthUnitRepository: IHealthUnitRepository;
  examRepository: IExamRepository;
  userRepository: IUserRepository;
}

export interface IParamsCreateExamBooking {
  healthUnitId: string;
  examOfferingId: string;
  scheduledAt: Date;
  notes?: string;
}

export interface IExamBookingRequester {
  sub: string;
  isAdmin: boolean;
  isExamProfessional: boolean;
  healthUnitId?: string;
}

export interface IExamSlotAvailability {
  time: string;
  remainingCapacity: number;
}

export interface IExamBookingService {
  createBooking(
    params: IParamsCreateExamBooking,
    requester: IExamBookingRequester,
  ): Promise<IExamBookingWithContext>;
  cancelBooking(
    id: string,
    requester: IExamBookingRequester,
    reason?: string,
  ): Promise<IExamBookingWithContext>;
  rescheduleBooking(
    id: string,
    newScheduledAt: Date,
    requester: IExamBookingRequester,
  ): Promise<IExamBookingWithContext>;
  updateStatus(
    id: string,
    newStatus: EExamBookingStatus,
    requester: IExamBookingRequester,
  ): Promise<IExamBookingWithContext>;
  getBookingById(
    id: string,
    requester: IExamBookingRequester,
  ): Promise<IExamBookingWithContext>;
  listBookingsByPatientId(
    patientId: string,
    requester: IExamBookingRequester,
    pagination?: IPaginationParams | null,
  ): Promise<{ items: IExamBookingWithContext[]; totalItems: number }>;
  listBookingsByHealthUnitId(
    healthUnitId: string,
    requester: IExamBookingRequester,
    filter: {
      date?: Date;
      startDate?: Date;
      endDate?: Date;
      status?: EExamBookingStatus;
    },
  ): Promise<IExamBookingWithContext[]>;
  getAvailableSlots(
    healthUnitId: string,
    date: Date,
  ): Promise<IExamSlotAvailability[]>;
  linkResultExam(
    bookingId: string,
    examId: string,
    requester: IExamBookingRequester,
  ): Promise<void>;
}
