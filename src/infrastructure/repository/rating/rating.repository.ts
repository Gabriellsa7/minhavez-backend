import { HydratedDocument, Types } from 'mongoose';
import { IRating } from '../../../domain/rating/interfaces/rating.interface';
import {
  IParamsUpsertRating,
  IRatingRepository,
  IRatingSummary,
} from '../../../domain/rating/repository/rating.repository.interface';
import { IRatingSchema } from '../../db/mongo/schema/rating.schema';
import { MRating } from '../../db/mongo/models/rating.model';

export class RatingRepository implements IRatingRepository {
  private mapToDomain(ratingDoc: HydratedDocument<IRatingSchema>): IRating {
    return {
      _id: ratingDoc._id.toString(),
      appointmentId: ratingDoc.appointmentId.toString(),
      patientId: ratingDoc.patientId.toString(),
      professionalId: ratingDoc.professionalId.toString(),
      healthUnitId: ratingDoc.healthUnitId.toString(),
      professionalStars: ratingDoc.professionalStars,
      professionalComment: ratingDoc.professionalComment,
      clinicStars: ratingDoc.clinicStars,
      clinicComment: ratingDoc.clinicComment,
      createdAt: ratingDoc.createdAt,
      updatedAt: ratingDoc.updatedAt,
    };
  }

  async getRatingByAppointmentId(
    appointmentId: string,
  ): Promise<IRating | null> {
    try {
      const ratingDoc = await MRating.findOne({
        appointmentId: new Types.ObjectId(appointmentId),
      });

      if (!ratingDoc) return null;

      return this.mapToDomain(ratingDoc);
    } catch (error) {
      throw new Error(
        `Error retrieving rating by appointment ID: ${(error as Error).message}`,
      );
    }
  }

  async upsertRating(params: IParamsUpsertRating): Promise<IRating> {
    try {
      const set: Record<string, unknown> = {};

      if (params.professionalStars !== undefined) {
        set.professionalStars = params.professionalStars;
        set.professionalComment = params.professionalComment;
      }
      if (params.clinicStars !== undefined) {
        set.clinicStars = params.clinicStars;
        set.clinicComment = params.clinicComment;
      }

      const ratingDoc = await MRating.findOneAndUpdate(
        { appointmentId: new Types.ObjectId(params.appointmentId) },
        {
          $set: set,
          $setOnInsert: {
            appointmentId: new Types.ObjectId(params.appointmentId),
            patientId: new Types.ObjectId(params.patientId),
            professionalId: new Types.ObjectId(params.professionalId),
            healthUnitId: new Types.ObjectId(params.healthUnitId),
          },
        },
        { upsert: true, new: true },
      );

      return this.mapToDomain(ratingDoc);
    } catch (error) {
      throw new Error(`Error upserting rating: ${(error as Error).message}`);
    }
  }

  async getProfessionalRatingSummary(
    professionalId: string,
  ): Promise<IRatingSummary> {
    try {
      const [result] = await MRating.aggregate<{
        _id: null;
        average: number;
        count: number;
      }>([
        {
          $match: {
            professionalId: new Types.ObjectId(professionalId),
            professionalStars: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$professionalStars' },
            count: { $sum: 1 },
          },
        },
      ]);

      if (!result) return { average: null, count: 0 };

      return { average: result.average, count: result.count };
    } catch (error) {
      throw new Error(
        `Error retrieving professional rating summary: ${(error as Error).message}`,
      );
    }
  }

  async getHealthUnitRatingSummary(
    healthUnitId: string,
  ): Promise<IRatingSummary> {
    try {
      const [result] = await MRating.aggregate<{
        _id: null;
        average: number;
        count: number;
      }>([
        {
          $match: {
            healthUnitId: new Types.ObjectId(healthUnitId),
            clinicStars: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$clinicStars' },
            count: { $sum: 1 },
          },
        },
      ]);

      if (!result) return { average: null, count: 0 };

      return { average: result.average, count: result.count };
    } catch (error) {
      throw new Error(
        `Error retrieving health unit rating summary: ${(error as Error).message}`,
      );
    }
  }
}
