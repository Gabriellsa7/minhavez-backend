import { IHealthProfessional } from '../interfaces/health-professional.interface';

export interface IParamsCreateHealthProfessional {
  userId: string;
  healthUnitId: string;
  specialty: string;
  professionalLicense: string;
}

export interface IParamsUpdateHealthProfessional {
  healthProfessionalData: Partial<IHealthProfessional>;
}

export interface IHealthProfessionalRepository {
  createHealthProfessional(
    healthProfessionalData: IParamsCreateHealthProfessional,
  ): Promise<IHealthProfessional>;
  updateHealthProfessionalById(
    id: string,
    params: IParamsUpdateHealthProfessional,
  ): Promise<IHealthProfessional | null>;
  deleteHealthProfessionalById(id: string): Promise<IHealthProfessional | null>;
  getHealthProfessionalById(id: string): Promise<IHealthProfessional | null>;
  getHealthProfessionalByUserId(
    userId: string,
  ): Promise<IHealthProfessional | null>;
  listHealthProfessionals(
    filter: Partial<IHealthProfessional>,
  ): Promise<IHealthProfessional[]>;
}
