import {
  IHealthUnitRepository,
  IParamsCreateHealthUnit,
  IParamsUpdateHealthUnit,
} from '../repository/health-unit.repository.interface';
import { IHealthUnit } from '../../user/interfaces/health-unit.interface';

export interface IParamsHealthUnitService {
  healthRepository: IHealthUnitRepository;
}

export interface IHealthUnitService {
  createHealthUnit(params: IParamsCreateHealthUnit): Promise<IHealthUnit>;
  updateHealthUnitById(
    id: string,
    params: IParamsUpdateHealthUnit,
  ): Promise<IHealthUnit | null>;
  deleteHealthUnitById(id: string): Promise<IHealthUnit | null>;
  getHealthUnitByEmail(email: string): Promise<IHealthUnit | null>;
  getHealthUnitById(id: string): Promise<IHealthUnit | null>;
  listHealthUnits(filter: Partial<IHealthUnit>): Promise<IHealthUnit[]>;
}
