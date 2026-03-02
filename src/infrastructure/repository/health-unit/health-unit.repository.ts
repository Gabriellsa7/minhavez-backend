import { HydratedDocument } from 'mongoose';
import { HealthUnit } from '../../../domain/health-unit/health-unit.entity';
import {
  IHealthUnitRepository,
  IParamsUpdateHealthUnit,
} from '../../../domain/health-unit/repository/health-unit.repository.interface';
import { IHealthUnit } from '../../../domain/health-unit/interfaces/health-unit.interface';
import { IHealthUnitSchema } from '../../db/mongo/schema/health-unit.schema';
import { Muser } from '../../db/mongo/models/health-unit.model';

export class HealthUnitRepository implements IHealthUnitRepository {
  private mapToDomain(
    healthUnitDoc: HydratedDocument<IHealthUnitSchema>,
  ): IHealthUnit {
    return new HealthUnit({
      _id: healthUnitDoc._id.toString(),
      name: healthUnitDoc.name,
      address: healthUnitDoc.address,
      phone: healthUnitDoc.phone,
      email: healthUnitDoc.email,
      createdAt: healthUnitDoc.createdAt,
    });
  }

  async createHealthUnit(healthUnitData: IHealthUnit) {
    try {
      const healthUnitDoc = await Muser.create(healthUnitData);
      return this.mapToDomain(healthUnitDoc);
    } catch (error) {
      throw new Error(
        `Error creating health unit: ${(error as Error).message}`,
      );
    }
  }

  async getHealthUnitByEmail(email: string): Promise<IHealthUnit | null> {
    try {
      const healthUnitDoc = await Muser.findOne({ email });
      if (healthUnitDoc) {
        return this.mapToDomain(healthUnitDoc);
      }
      return null;
    } catch (error) {
      throw new Error(
        `Error getting health unit by email: ${(error as Error).message}`,
      );
    }
  }

  async getHealthUnitById(_id: string): Promise<IHealthUnit | null> {
    try {
      const healthUnitDoc = await Muser.findById(_id);
      if (healthUnitDoc) {
        return this.mapToDomain(healthUnitDoc);
      }
      return null;
    } catch (error) {
      throw new Error(
        `Error getting health unit by id: ${(error as Error).message}`,
      );
    }
  }

  async updateHealthUnitById(
    _id: string,
    updateData: IParamsUpdateHealthUnit,
  ): Promise<IHealthUnit | null> {
    try {
      const healthUnitDoc = await Muser.findByIdAndUpdate(_id, updateData, {
        new: true,
      });
      if (healthUnitDoc) {
        return this.mapToDomain(healthUnitDoc);
      }
      return null;
    } catch (error) {
      throw new Error(
        `Error updating health unit by id: ${(error as Error).message}`,
      );
    }
  }

  async deleteHealthUnitById(_id: string): Promise<IHealthUnit | null> {
    try {
      const healthUnitDoc = await Muser.findByIdAndDelete(_id);
      if (healthUnitDoc) {
        return this.mapToDomain(healthUnitDoc);
      }
      return null;
    } catch (error) {
      throw new Error(
        `Error deleting health unit by id: ${(error as Error).message}`,
      );
    }
  }

  async listHealthUnits(filter: Partial<IHealthUnit>): Promise<IHealthUnit[]> {
    try {
      const healthUnitsDocs = await Muser.find(filter);
      return healthUnitsDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing health units: ${(error as Error).message}`,
      );
    }
  }
}
