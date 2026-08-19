import {
  EHealthProfessionalType,
  IHealthProfessional,
  IHealthProfessionalSchedule,
} from '../interfaces/health-professional.interface';
import { IPaginationParams } from '../../../shared/utils/pagination';

export interface IParamsCreateHealthProfessional {
  userId: string;
  healthUnitId: string;
  specialty: string;
  name: string;
  email: string;
  password: string;
  professionalLicense: string;
  room: string;
  schedule: IHealthProfessionalSchedule;
  type?: EHealthProfessionalType;
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
  getHealthProfessionalByUserId(userId: string): Promise<IHealthProfessional[]>;
  getHealthProfessionalByAppointmentId(
    appointmentId: string,
  ): Promise<IHealthProfessional | null>;
  listHealthProfessionals(
    filter: Partial<IHealthProfessional>,
    search?: string,
    pagination?: IPaginationParams | null,
  ): Promise<{ items: IHealthProfessional[]; totalItems: number }>;
  findHealthProfessionalByEmailWithPassword(
    email: string,
  ): Promise<(IHealthProfessional & { password: string }) | null>;
}
