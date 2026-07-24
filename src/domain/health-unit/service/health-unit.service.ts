import { IHealthUnit } from '../interfaces/health-unit.interface';
import {
  IHealthUnitService,
  IParamsHealthUnitService,
} from '../interfaces/health-unit.service.interface';
import {
  IHealthUnitRepository,
  IParamsCreateHealthUnit,
} from '../repository/health-unit.repository.interface';
import { uploadImageToCloudinary } from '../../../infrastructure/external/cloudinary/cloudinary-upload';
import { IHealthUnitImageUploadParams } from '../interfaces/health-unit.service.interface';

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

  async getHealthUnitsByUserId(userId: string): Promise<IHealthUnit[]> {
    try {
      return await this.healthUnitRepository.getHealthUnitsByUserId(userId);
    } catch (error) {
      throw new Error(
        `Error retrieving health units by user ID: ${(error as Error).message}`,
      );
    }
  }

  async updateHealthUnitById(
    _id: string,
    params: Partial<IHealthUnit>,
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

  async uploadHealthUnitImage(
    _id: string,
    params: IHealthUnitImageUploadParams,
  ): Promise<IHealthUnit | null> {
    try {
      const existingUnit =
        await this.healthUnitRepository.getHealthUnitById(_id);

      if (!existingUnit) {
        throw new Error('Health unit not found');
      }

      const uploadedImage = await uploadImageToCloudinary({
        imageBase64: params.imageBase64,
        fileName: params.fileName,
        mimeType: params.mimeType,
      });

      return await this.healthUnitRepository.updateHealthUnitById(_id, {
        img: uploadedImage.secureUrl,
      });
    } catch (error) {
      throw new Error(
        `Error uploading health unit image: ${(error as Error).message}`,
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
