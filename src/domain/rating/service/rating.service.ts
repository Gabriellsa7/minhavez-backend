import { EAppointmentStatus } from '../../appointment/interfaces/appointment.interface';
import { IAppointmentRepository } from '../../appointment/repository/appointment.repository.interface';
import {
  IRatingRepository,
  IRatingSummary,
} from '../repository/rating.repository.interface';
import { IRating } from '../interfaces/rating.interface';
import {
  IParamsRatingService,
  IParamsSubmitRating,
  IRatingEligibility,
  IRatingService,
} from '../interfaces/rating.service.interface';

export class RatingService implements IRatingService {
  private ratingRepository: IRatingRepository;
  private appointmentRepository: IAppointmentRepository;

  constructor(params: IParamsRatingService) {
    this.ratingRepository = params.ratingRepository;
    this.appointmentRepository = params.appointmentRepository;
  }

  private validateStars(stars: number): void {
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw new Error('Rating stars must be an integer between 1 and 5');
    }
  }

  async getRatingEligibility(
    appointmentId: string,
  ): Promise<IRatingEligibility> {
    try {
      const appointment =
        await this.appointmentRepository.getAppointmentById(appointmentId);

      if (!appointment || appointment.status !== EAppointmentStatus.COMPLETED) {
        return { canRateProfessional: false, canRateClinic: false };
      }

      const existingRating =
        await this.ratingRepository.getRatingByAppointmentId(appointmentId);

      const completedWithProfessional =
        await this.appointmentRepository.listAppointments({
          patientId: appointment.patientId,
          professionalId: appointment.professionalId,
          status: EAppointmentStatus.COMPLETED,
        });

      const completedAtClinic = await this.appointmentRepository.listAppointments(
        {
          patientId: appointment.patientId,
          healthUnitId: appointment.healthUnitId,
          status: EAppointmentStatus.COMPLETED,
        },
      );

      const canRateProfessional =
        completedWithProfessional.length === 1 &&
        !existingRating?.professionalStars;

      const canRateClinic =
        completedAtClinic.length === 1 && !existingRating?.clinicStars;

      return {
        canRateProfessional,
        canRateClinic,
        professionalId: appointment.professionalId,
        healthUnitId: appointment.healthUnitId,
      };
    } catch (error) {
      throw new Error(
        `Error getting rating eligibility: ${(error as Error).message}`,
      );
    }
  }

  async submitRating(
    appointmentId: string,
    params: IParamsSubmitRating,
  ): Promise<IRating> {
    try {
      const appointment =
        await this.appointmentRepository.getAppointmentById(appointmentId);

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const eligibility = await this.getRatingEligibility(appointmentId);

      const fields: {
        professionalStars?: number;
        professionalComment?: string;
        clinicStars?: number;
        clinicComment?: string;
      } = {};

      if (eligibility.canRateProfessional && params.professionalStars !== undefined) {
        this.validateStars(params.professionalStars);
        fields.professionalStars = params.professionalStars;
        fields.professionalComment = params.professionalComment;
      }

      if (eligibility.canRateClinic && params.clinicStars !== undefined) {
        this.validateStars(params.clinicStars);
        fields.clinicStars = params.clinicStars;
        fields.clinicComment = params.clinicComment;
      }

      if (
        fields.professionalStars === undefined &&
        fields.clinicStars === undefined
      ) {
        throw new Error('Nothing eligible to rate for this appointment');
      }

      return await this.ratingRepository.upsertRating({
        appointmentId,
        patientId: appointment.patientId,
        professionalId: appointment.professionalId,
        healthUnitId: appointment.healthUnitId,
        ...fields,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Error submitting rating: ${(error as Error).message}`);
    }
  }

  async getProfessionalRatingSummary(
    professionalId: string,
  ): Promise<IRatingSummary> {
    try {
      return await this.ratingRepository.getProfessionalRatingSummary(
        professionalId,
      );
    } catch (error) {
      throw new Error(
        `Error getting professional rating summary: ${(error as Error).message}`,
      );
    }
  }

  async getHealthUnitRatingSummary(
    healthUnitId: string,
  ): Promise<IRatingSummary> {
    try {
      return await this.ratingRepository.getHealthUnitRatingSummary(
        healthUnitId,
      );
    } catch (error) {
      throw new Error(
        `Error getting health unit rating summary: ${(error as Error).message}`,
      );
    }
  }
}
