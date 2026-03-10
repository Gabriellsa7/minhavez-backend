import { IHealthProfessional } from '../interfaces/health-professional.interface';
import {
  IHealthProfessionalService,
  IParamsHealthProfessionalService,
} from '../interfaces/health-professional.service.interface';
import {
  IParamsCreateHealthProfessional,
  IParamsUpdateHealthProfessional,
  IHealthProfessionalRepository,
} from '../repository/health-professional.repository.interface';

export class HealthProfessionalService implements IHealthProfessionalService {
  private healthProfessionalRepository: IHealthProfessionalRepository;

  constructor(params: IParamsHealthProfessionalService) {
    this.healthProfessionalRepository = params.healthProfessionalRepository;
  }

  async createHealthProfessional(
    params: IParamsCreateHealthProfessional,
  ): Promise<IHealthProfessional> {
    try {
      const existingHealthProfessional =
        await this.healthProfessionalRepository.getHealthProfessionalByUserId(
          params.userId,
        );

      if (existingHealthProfessional) {
        throw new Error(
          'A health professional with this user ID already exists',
        );
      }

      return await this.healthProfessionalRepository.createHealthProfessional(
        params,
      );
    } catch (error) {
      throw new Error(
        `Error creating health professional: ${(error as Error).message}`,
      );
    }
  }

  getHealthProfessionalById(_id: string): Promise<IHealthProfessional | null> {
    try {
      const healthProfessional =
        this.healthProfessionalRepository.getHealthProfessionalById(_id);

      if (!healthProfessional) {
        throw new Error('Health professional not found');
      }

      return healthProfessional;
    } catch (error) {
      throw new Error(
        `Error retrieving health professional by ID: ${(error as Error).message}`,
      );
    }
  }

  getHealthProfessionalByUserId(
    userId: string,
  ): Promise<IHealthProfessional | null> {
    try {
      const healthProfessional =
        this.healthProfessionalRepository.getHealthProfessionalByUserId(userId);

      if (!healthProfessional) {
        throw new Error('Health professional not found');
      }

      return healthProfessional;
    } catch (error) {
      throw new Error(
        `Error retrieving health professional by user ID: ${(error as Error).message}`,
      );
    }
  }

  async updateHealthProfessionalById(
    _id: string,
    params: IParamsUpdateHealthProfessional,
  ): Promise<IHealthProfessional> {
    try {
      const updatedHealthProfessional =
        await this.healthProfessionalRepository.updateHealthProfessionalById(
          _id,
          params,
        );

      if (!updatedHealthProfessional) {
        throw new Error('Health professional not found');
      }

      return updatedHealthProfessional;
    } catch (error) {
      throw new Error(
        `Error updating health professional: ${(error as Error).message}`,
      );
    }
  }

  async deleteHealthProfessionalById(
    _id: string,
  ): Promise<IHealthProfessional> {
    try {
      const healthProfessional =
        await this.healthProfessionalRepository.deleteHealthProfessionalById(
          _id,
        );

      if (!healthProfessional) {
        throw new Error('Health professional not found');
      }

      return healthProfessional;
    } catch (error) {
      throw new Error(
        `Error deleting health professional: ${(error as Error).message}`,
      );
    }
  }

  async listHealthProfessionals(
    filter: Partial<IHealthProfessional>,
  ): Promise<IHealthProfessional[]> {
    try {
      return await this.healthProfessionalRepository.listHealthProfessionals(
        filter,
      );
    } catch (error) {
      throw new Error(
        `Error listing health professionals: ${(error as Error).message}`,
      );
    }
  }
}
