import { IRating } from '../interfaces/rating.interface';

export interface IParamsUpsertRating {
  appointmentId: string;
  patientId: string;
  professionalId: string;
  healthUnitId: string;
  professionalStars?: number;
  professionalComment?: string;
  clinicStars?: number;
  clinicComment?: string;
}

export interface IRatingSummary {
  average: number | null;
  count: number;
}

export interface IRatingRepository {
  getRatingByAppointmentId(appointmentId: string): Promise<IRating | null>;
  upsertRating(params: IParamsUpsertRating): Promise<IRating>;
  getProfessionalRatingSummary(
    professionalId: string,
  ): Promise<IRatingSummary>;
  getHealthUnitRatingSummary(healthUnitId: string): Promise<IRatingSummary>;
}
