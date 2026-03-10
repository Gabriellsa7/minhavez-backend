import {
  IHealthProfessionalRepository,
  IParamsCreateHealthProfessional,
  IParamsUpdateHealthProfessional,
} from '../repository/health-professional.repository.interface';
import { IHealthProfessional } from './health-professional.interface';

export interface IParamsHealthProfessionalService {
  healthProfessionalRepository: IHealthProfessionalRepository;
}

export interface IHealthProfessionalService {
  createHealthProfessional(
    params: IParamsCreateHealthProfessional,
  ): Promise<IHealthProfessional>;
  getHealthProfessionalById(_id: string): Promise<IHealthProfessional | null>;
  getHealthProfessionalByUserId(
    userId: string,
  ): Promise<IHealthProfessional | null>;
  updateHealthProfessionalById(
    _id: string,
    params: IParamsUpdateHealthProfessional,
  ): Promise<IHealthProfessional | null>;
  deleteHealthProfessionalById(
    _id: string,
  ): Promise<IHealthProfessional | null>;
  listHealthProfessionals(
    filter: Partial<IHealthProfessional>,
  ): Promise<IHealthProfessional[]>;
}
