import { HydratedDocument, FilterQuery } from 'mongoose';
import { IHealthProfessionalSchema } from '../../db/mongo/schema/health-professional.schema';
import {
  EHealthProfessionalType,
  IHealthProfessional,
} from '../../../domain/health-professional.ts/interfaces/health-professional.interface';
import {
  IParamsCreateHealthProfessional,
  IParamsUpdateHealthProfessional,
  IHealthProfessionalRepository,
} from '../../../domain/health-professional.ts/repository/health-professional.repository.interface';
import { MHealthProfessional } from '../../db/mongo/models/health-professional.model';
import { MAppointment } from '../../db/mongo/models/appointment.model';

export class HealthProfessionalRepository
  implements IHealthProfessionalRepository
{
  private mapToDomain(
    healthProfessionalDoc: HydratedDocument<IHealthProfessionalSchema>,
  ): IHealthProfessional {
    return {
      _id: healthProfessionalDoc._id.toString(),
      userId: healthProfessionalDoc.userId?.toString() || '',
      healthUnitId: healthProfessionalDoc.healthUnitId.toString(),
      specialty: healthProfessionalDoc.specialty,
      name: healthProfessionalDoc.name,
      email: healthProfessionalDoc.email,
      room: healthProfessionalDoc.room,
      password: healthProfessionalDoc.password,
      professionalLicense: healthProfessionalDoc.professionalLicense,
      type: healthProfessionalDoc.type,
      active: healthProfessionalDoc.active,
      avatar: healthProfessionalDoc.avatar,
      schedule: healthProfessionalDoc.schedule,
      createdAt: healthProfessionalDoc.createdAt,
      updatedAt: healthProfessionalDoc.updatedAt,
    };
  }

  async createHealthProfessional(
    healthProfessionalData: IParamsCreateHealthProfessional,
  ): Promise<IHealthProfessional> {
    try {
      const healthProfessionalDoc = await MHealthProfessional.create(
        healthProfessionalData,
      );
      return this.mapToDomain(healthProfessionalDoc);
    } catch (error) {
      throw new Error(
        `Error creating health professional: ${(error as Error).message}`,
      );
    }
  }

  async updateHealthProfessionalById(
    _id: string,
    params: IParamsUpdateHealthProfessional,
  ): Promise<IHealthProfessional | null> {
    try {
      const healthProfessionalDoc = await MHealthProfessional.findByIdAndUpdate(
        _id,
        params,
        {
          new: true,
        },
      );

      if (!healthProfessionalDoc) return null;

      return this.mapToDomain(healthProfessionalDoc);
    } catch (error) {
      throw new Error(
        `Error updating health professional: ${(error as Error).message}`,
      );
    }
  }

  async deleteHealthProfessionalById(
    id: string,
  ): Promise<IHealthProfessional | null> {
    try {
      const healthProfessionalDoc =
        await MHealthProfessional.findByIdAndDelete(id);

      if (!healthProfessionalDoc) return null;

      return this.mapToDomain(healthProfessionalDoc);
    } catch (error) {
      throw new Error(
        `Error deleting health professional: ${(error as Error).message}`,
      );
    }
  }

  async getHealthProfessionalById(
    id: string,
  ): Promise<IHealthProfessional | null> {
    try {
      const healthProfessionalDoc = await MHealthProfessional.findById(id);

      if (!healthProfessionalDoc) return null;

      return this.mapToDomain(healthProfessionalDoc);
    } catch (error) {
      throw new Error(
        `Error fetching health professional: ${(error as Error).message}`,
      );
    }
  }

  async getHealthProfessionalByUserId(
    userId: string,
  ): Promise<IHealthProfessional[]> {
    try {
      const healthProfessionalDocs = await MHealthProfessional.find({
        userId,
      });

      return healthProfessionalDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error fetching health professional by user ID: ${(error as Error).message}`,
      );
    }
  }
  async getHealthProfessionalsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IHealthProfessional[]> {
    try {
      const healthProfessionalDocs = await MHealthProfessional.find({
        healthUnitId,
      });

      return healthProfessionalDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error fetching health professionals by health unit ID: ${(error as Error).message}`,
      );
    }
  }

  async findHealthProfessionalByEmailWithPassword(
    email: string,
  ): Promise<(IHealthProfessional & { password: string }) | null> {
    try {
      const professional = await MHealthProfessional.findOne({ email }).select(
        '+password',
      );

      if (!professional) {
        return null;
      }

      return {
        _id: professional._id.toString(),
        userId: professional.userId?.toString(),
        healthUnitId: professional.healthUnitId.toString(),
        specialty: professional.specialty,
        name: professional.name,
        email: professional.email,
        room: professional.room,
        password: professional.password,
        professionalLicense: professional.professionalLicense,
        type: professional.type,
        schedule: professional.schedule,
        active: professional.active,
        avatar: professional.avatar,
        createdAt: professional.createdAt,
        updatedAt: professional.updatedAt,
      };
    } catch (error) {
      throw new Error(
        `Error finding health professional by email: ${(error as Error).message}`,
      );
    }
  }

  async getHealthProfessionalByAppointmentId(
    appointmentId: string,
  ): Promise<IHealthProfessional | null> {
    try {
      const appointment = await MAppointment.findById(appointmentId);

      if (!appointment) {
        return null;
      }

      const healthProfessionalDoc = await MHealthProfessional.findById(
        appointment.professionalId,
      );

      if (!healthProfessionalDoc) {
        return null;
      }

      return this.mapToDomain(healthProfessionalDoc);
    } catch (error) {
      throw new Error(
        `Error fetching health professional by appointment ID: ${
          (error as Error).message
        }`,
      );
    }
  }

  async listHealthProfessionals(
    filter: Partial<IHealthProfessional>,
    search?: string,
  ): Promise<IHealthProfessional[]> {
    try {
      // Convert string IDs from filter to ObjectIds for Mongoose queries
      const mongoFilter: FilterQuery<IHealthProfessionalSchema> = {};

      if (filter._id) {
        mongoFilter._id = filter._id;
      }
      if (filter.healthUnitId) {
        mongoFilter.healthUnitId = filter.healthUnitId;
      }
      if (filter.userId) {
        mongoFilter.userId = filter.userId;
      }

      if (filter.type) {
        mongoFilter.type = filter.type;
      } else {
        // Exam professionals don't take regular consultations — this listing
        // backs the patient-facing "pick a professional to book" screens, so
        // they must be excluded unless a caller explicitly asks for a type.
        mongoFilter.type = { $ne: EHealthProfessionalType.EXAM_PROFESSIONAL };
      }

      if (search) {
        const searchRegex = new RegExp(
          search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i',
        );
        mongoFilter.$or = [{ name: searchRegex }, { specialty: searchRegex }];
      }

      const healthProfessionalDocs =
        await MHealthProfessional.find(mongoFilter);

      return healthProfessionalDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error fetching health professionals: ${(error as Error).message}`,
      );
    }
  }
}
