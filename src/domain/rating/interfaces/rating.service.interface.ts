import { IAppointmentRepository } from '../../appointment/repository/appointment.repository.interface';
import { IRatingRepository, IRatingSummary } from '../repository/rating.repository.interface';
import { IRating } from './rating.interface';

export interface IParamsRatingService {
  ratingRepository: IRatingRepository;
  appointmentRepository: IAppointmentRepository;
}

export interface IRatingEligibility {
  canRateProfessional: boolean;
  canRateClinic: boolean;
  professionalId?: string;
  healthUnitId?: string;
}

export interface IParamsSubmitRating {
  professionalStars?: number;
  professionalComment?: string;
  clinicStars?: number;
  clinicComment?: string;
}

export interface IRatingService {
  getRatingEligibility(appointmentId: string): Promise<IRatingEligibility>;
  submitRating(
    appointmentId: string,
    params: IParamsSubmitRating,
  ): Promise<IRating>;
  getProfessionalRatingSummary(
    professionalId: string,
  ): Promise<IRatingSummary>;
  getHealthUnitRatingSummary(healthUnitId: string): Promise<IRatingSummary>;
}
