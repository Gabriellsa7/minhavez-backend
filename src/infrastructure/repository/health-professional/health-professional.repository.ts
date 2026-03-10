import { HydratedDocument } from 'mongoose';
import { IHealthProfessionalSchema } from '../../db/mongo/schema/health-professional.schema';
import { IHealthProfessional } from '../../../domain/health-professional.ts/interfaces/health-professional.interface';
import {
  IParamsCreateHealthProfessional,
  IParamsUpdateHealthProfessional,
} from '../../../domain/health-professional.ts/repository/health-professional.repository.interface';
import { Muser } from '../../db/mongo/models/health-professional.model';

export class HealthProfessionalRepository {
  private mapToDomain(
    healthProfessionalDoc: HydratedDocument<IHealthProfessionalSchema>,
  ): IHealthProfessional {
    return {
      _id: healthProfessionalDoc._id.toString(),
      userId: healthProfessionalDoc.userId.toString(),
      healthUnitId: healthProfessionalDoc.healthUnitId.toString(),
      specialty: healthProfessionalDoc.specialty,
      professionalLicense: healthProfessionalDoc.professionalLicense,
      active: healthProfessionalDoc.active,
      createdAt: healthProfessionalDoc.createdAt,
      updatedAt: healthProfessionalDoc.updatedAt,
    };
  }

  async createHealthProfessional(
    healthProfessionalData: IParamsCreateHealthProfessional,
  ): Promise<IHealthProfessional> {
    try {
      const healthProfessionalDoc = await Muser.create(healthProfessionalData);
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
      const healthProfessionalDoc = await Muser.findByIdAndUpdate(_id, params, {
        new: true,
      });

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
      const healthProfessionalDoc = await Muser.findByIdAndDelete(id);

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
      const healthProfessionalDoc = await Muser.findById(id);

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
  ): Promise<IHealthProfessional | null> {
    try {
      const healthProfessionalDoc = await Muser.findOne({ userId });

      if (!healthProfessionalDoc) return null;

      return this.mapToDomain(healthProfessionalDoc);
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
      const healthProfessionalDocs = await Muser.find({ healthUnitId });

      return healthProfessionalDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error fetching health professionals by health unit ID: ${(error as Error).message}`,
      );
    }
  }

  async listHealthProfessionals(): Promise<IHealthProfessional[]> {
    try {
      const healthProfessionalDocs = await Muser.find();

      return healthProfessionalDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error fetching health professionals: ${(error as Error).message}`,
      );
    }
  }
}
