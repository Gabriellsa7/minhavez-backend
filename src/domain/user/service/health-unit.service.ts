import { IHealthUnit } from '../interfaces/health-unit.interface';
import {
  IHealthUnitService,
  IParamsHealthUnitService,
} from '../interfaces/health-unit.service.interface';
import {
  IHealthUnitRepository,
  IParamsCreateHealthUnit,
  IParamsUpdateHealthUnit,
} from '../repository/health-unit.repository.interface';

export class HealthUnitService implements IHealthUnitService {
  private healthUnitRepository: IHealthUnitRepository;

  constructor(params: IParamsHealthUnitService) {
    this.healthUnitRepository = params.healthRepository;
  }

  async createHealthUnit(
    params: IParamsCreateHealthUnit,
  ): Promise<IHealthUnit> {
    try {
      const existingUnit = await this.healthUnitRepository.getHealthUnitByEmail(
        params.email,
      );

      if (existingUnit) {
        throw new Error('A health unit with this email already exists');
      }

      return await this.healthUnitRepository.createHealthUnit(params);
    } catch (error) {
      throw new Error(
        `Error creating health unit: ${(error as Error).message}`,
      );
    }
  }

  async getHealthUnitById(_id: string): Promise<IHealthUnit | null> {
    try {
      const unit = await this.healthUnitRepository.getHealthUnitById(_id);

      if (!unit) {
        throw new Error('Health unit not found');
      }

      return unit;
    } catch (error) {
      throw new Error(
        `Error retrieving health unit by ID: ${(error as Error).message}`,
      );
    }
  }

  async getHealthUnitByEmail(email: string): Promise<IHealthUnit | null> {
    try {
      const unit = await this.healthUnitRepository.getHealthUnitByEmail(email);

      if (!unit) {
        throw new Error('Health unit not found');
      }

      return unit;
    } catch (error) {
      throw new Error(
        `Error retrieving health unit by email: ${(error as Error).message}`,
      );
    }
  }

  async updateHealthUnitById(
    _id: string,
    params: IParamsUpdateHealthUnit,
  ): Promise<IHealthUnit | null> {
    try {
      const existingUnit = await this.getHealthUnitById(_id);

      if (!existingUnit) {
        throw new Error('Health unit not found');
      }

      return await this.healthUnitRepository.updateHealthUnitById(_id, params);
    } catch (error) {
      throw new Error(
        `Error updating health unit: ${(error as Error).message}`,
      );
    }
  }

  async deleteHealthUnitById(_id: string): Promise<IHealthUnit | null> {
    try {
      const existingUnit = await this.getHealthUnitById(_id);

      if (!existingUnit) {
        throw new Error('Health unit not found');
      }

      return await this.healthUnitRepository.deleteHealthUnitById(_id);
    } catch (error) {
      throw new Error(
        `Error deleting health unit: ${(error as Error).message}`,
      );
    }
  }

  async listHealthUnits(filter: Partial<IHealthUnit>): Promise<IHealthUnit[]> {
    try {
      return await this.healthUnitRepository.listHealthUnits(filter);
    } catch (error) {
      throw new Error(
        `Error listing health units: ${(error as Error).message}`,
      );
    }
  }
}
