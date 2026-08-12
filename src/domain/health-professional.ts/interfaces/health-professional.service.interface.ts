import {
  IHealthProfessionalRepository,
  IParamsCreateHealthProfessional,
  IParamsUpdateHealthProfessional,
} from '../repository/health-professional.repository.interface';
import { IHealthProfessional } from './health-professional.interface';

export interface IParamsHealthProfessionalService {
  healthProfessionalRepository: IHealthProfessionalRepository;
}

export interface IParamsUploadHealthProfessionalImage {
  imageBase64: string;
  fileName?: string;
  mimeType?: string;
}

export interface IHealthProfessionalService {
  createHealthProfessional(
    params: IParamsCreateHealthProfessional,
  ): Promise<IHealthProfessional>;
  getHealthProfessionalById(_id: string): Promise<IHealthProfessional | null>;
  getHealthProfessionalByUserId(userId: string): Promise<IHealthProfessional[]>;
  getHealthProfessionalByAppointmentId(
    appointmentId: string,
  ): Promise<IHealthProfessional | null>;
  updateHealthProfessionalById(
    _id: string,
    params: IParamsUpdateHealthProfessional,
  ): Promise<IHealthProfessional | null>;
  uploadHealthProfessionalImage(
    _id: string,
    params: IParamsUploadHealthProfessionalImage,
  ): Promise<IHealthProfessional | null>;
  deleteHealthProfessionalById(
    _id: string,
  ): Promise<IHealthProfessional | null>;
  listHealthProfessionals(
    filter: Partial<IHealthProfessional>,
    search?: string,
  ): Promise<IHealthProfessional[]>;
}
