import {
  IHealthUnitRepository,
  IParamsCreateHealthUnit,
} from '../repository/health-unit.repository.interface';
import { IHealthUnit } from './health-unit.interface';

export interface IParamsHealthUnitService {
  healthRepository: IHealthUnitRepository;
}

export interface IHealthUnitService {
  createHealthUnit(params: IParamsCreateHealthUnit): Promise<IHealthUnit>;
  updateHealthUnitById(id: string, params: Partial<IHealthUnit>): Promise<IHealthUnit | null>;
  uploadHealthUnitImage(
    id: string,
    params: IHealthUnitImageUploadParams,
  ): Promise<IHealthUnit | null>;
  deleteHealthUnitById(id: string): Promise<IHealthUnit | null>;
  getHealthUnitByEmail(email: string): Promise<IHealthUnit | null>;
  getHealthUnitById(id: string): Promise<IHealthUnit | null>;
  listHealthUnits(filter: Partial<IHealthUnit>): Promise<IHealthUnit[]>;
}

export interface IHealthUnitImageUploadParams {
  imageBase64: string;
  fileName?: string;
  mimeType?: string;
}
