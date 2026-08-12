import { IHealthProfessional } from '../interfaces/health-professional.interface';
import {
  IHealthProfessionalService,
  IParamsHealthProfessionalService,
  IParamsUploadHealthProfessionalImage,
} from '../interfaces/health-professional.service.interface';
import bcrypt from 'bcrypt';
import {
  IParamsCreateHealthProfessional,
  IParamsUpdateHealthProfessional,
  IHealthProfessionalRepository,
} from '../repository/health-professional.repository.interface';
import { uploadImageToCloudinary } from '../../../infrastructure/external/cloudinary/cloudinary-upload';

export class HealthProfessionalService implements IHealthProfessionalService {
  private healthProfessionalRepository: IHealthProfessionalRepository;

  constructor(params: IParamsHealthProfessionalService) {
    this.healthProfessionalRepository = params.healthProfessionalRepository;
  }

  async createHealthProfessional(
    params: IParamsCreateHealthProfessional,
  ): Promise<IHealthProfessional> {
    try {
      const hashedPassword = await bcrypt.hash(params.password, 10);

      return await this.healthProfessionalRepository.createHealthProfessional({
        ...params,
        password: hashedPassword,
      });
    } catch (error) {
      throw new Error(
        `Error creating health professional: ${(error as Error).message}`,
      );
    }
  }

  async getHealthProfessionalById(
    _id: string,
  ): Promise<IHealthProfessional | null> {
    try {
      const healthProfessional =
        await this.healthProfessionalRepository.getHealthProfessionalById(_id);

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

  async getHealthProfessionalByUserId(
    userId: string,
  ): Promise<IHealthProfessional[]> {
    try {
      return await this.healthProfessionalRepository.getHealthProfessionalByUserId(
        userId,
      );
    } catch (error) {
      throw new Error(
        `Error retrieving health professional by user ID: ${(error as Error).message}`,
      );
    }
  }

  async getHealthProfessionalByAppointmentId(
    appointmentId: string,
  ): Promise<IHealthProfessional | null> {
    try {
      const healthProfessional =
        await this.healthProfessionalRepository.getHealthProfessionalByAppointmentId(
          appointmentId,
        );

      if (!healthProfessional) {
        throw new Error('Health professional not found');
      }

      return healthProfessional;
    } catch (error) {
      throw new Error(
        `Error retrieving health professional by appointment ID: ${(error as Error).message}`,
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

  async uploadHealthProfessionalImage(
    _id: string,
    params: IParamsUploadHealthProfessionalImage,
  ): Promise<IHealthProfessional | null> {
    try {
      const existingHealthProfessional =
        await this.healthProfessionalRepository.getHealthProfessionalById(_id);

      if (!existingHealthProfessional) {
        throw new Error('Health professional not found');
      }

      const uploadedImage = await uploadImageToCloudinary({
        imageBase64: params.imageBase64,
        fileName: params.fileName,
        mimeType: params.mimeType,
      });

      return await this.healthProfessionalRepository.updateHealthProfessionalById(
        _id,
        {
          avatar: uploadedImage.secureUrl,
        } as unknown as IParamsUpdateHealthProfessional,
      );
    } catch (error) {
      throw new Error(
        `Error uploading health professional image: ${(error as Error).message}`,
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
    search?: string,
  ): Promise<IHealthProfessional[]> {
    try {
      return await this.healthProfessionalRepository.listHealthProfessionals(
        filter,
        search,
      );
    } catch (error) {
      throw new Error(
        `Error listing health professionals: ${(error as Error).message}`,
      );
    }
  }
}
