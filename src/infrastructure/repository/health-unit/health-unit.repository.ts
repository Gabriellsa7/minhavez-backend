import { FilterQuery, HydratedDocument } from 'mongoose';
import { HealthUnit } from '../../../domain/health-unit/health-unit.entity';
import {
  IHealthUnitRepository,
  IParamsCreateHealthUnit,
} from '../../../domain/health-unit/repository/health-unit.repository.interface';
import { IHealthUnit } from '../../../domain/health-unit/interfaces/health-unit.interface';
import { IHealthUnitSchema } from '../../db/mongo/schema/health-unit.schema';
import { MHealthUnit } from '../../db/mongo/models/health-unit.model';

export class HealthUnitRepository implements IHealthUnitRepository {
  private mapToDomain(
    healthUnitDoc: HydratedDocument<IHealthUnitSchema>,
  ): IHealthUnit {
    return new HealthUnit({
      _id: healthUnitDoc._id.toString(),
      userId: healthUnitDoc.userId?.toString(),
      name: healthUnitDoc.name,
      address: healthUnitDoc.address,
      phone: healthUnitDoc.phone,
      description: healthUnitDoc.description,
      services: healthUnitDoc.services.map((service) => ({
        _id: service._id.toString(),
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      })),
      openingHours: healthUnitDoc.openingHours.map((openingHour) => ({
        day: openingHour.day,
        open: openingHour.open,
        close: openingHour.close,
        isClosed: openingHour.isClosed,
      })),
      email: healthUnitDoc.email,
      img: healthUnitDoc.img ?? undefined,
      createdAt: healthUnitDoc.createdAt,
      updateAt: healthUnitDoc.updatedAt,
    });
  }

  async createHealthUnit(healthUnitData: IParamsCreateHealthUnit) {
    try {
      const healthUnitDoc = await MHealthUnit.create(healthUnitData);
      return this.mapToDomain(healthUnitDoc);
    } catch (error) {
      throw new Error(
        `Error creating health unit: ${(error as Error).message}`,
      );
    }
  }

  async getHealthUnitByEmail(email: string): Promise<IHealthUnit | null> {
    try {
      const healthUnitDoc = await MHealthUnit.findOne({ email });
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
      const healthUnitDoc = await MHealthUnit.findById(_id);
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

  async getHealthUnitsByUserId(userId: string): Promise<IHealthUnit[]> {
    try {
      const healthUnitDocs = await MHealthUnit.find({ userId });
      return healthUnitDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error getting health units by user ID: ${(error as Error).message}`,
      );
    }
  }

  async updateHealthUnitById(
    _id: string,
    updateData: Partial<IHealthUnit>,
  ): Promise<IHealthUnit | null> {
    try {
      const healthUnitDoc = await MHealthUnit.findByIdAndUpdate(
        _id,
        updateData,
        {
          new: true,
        },
      );
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
      const healthUnitDoc = await MHealthUnit.findByIdAndDelete(_id);
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

  async listHealthUnits(
    filter: Partial<IHealthUnit>,
    search?: string,
  ): Promise<IHealthUnit[]> {
    try {
      const mongoFilter: FilterQuery<IHealthUnitSchema> = { ...filter };

      if (search) {
        const searchRegex = new RegExp(
          search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'i',
        );
        mongoFilter.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { 'address.city': searchRegex },
          { 'address.neighborhood': searchRegex },
          { 'address.street': searchRegex },
        ];
      }

      const healthUnitsDocs = await MHealthUnit.find(mongoFilter);
      return healthUnitsDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing health units: ${(error as Error).message}`,
      );
    }
  }
}
