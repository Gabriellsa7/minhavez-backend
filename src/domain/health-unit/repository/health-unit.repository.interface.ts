import {
  IHealthUnit,
  IHealthUnitAddress,
} from '../interfaces/health-unit.interface';

export interface IParamsCreateHealthUnit {
  name: string;
  address: IHealthUnitAddress;
  phone: string;
  email: string;
}

export interface IParamsUpdateHealthUnit {
  healthUnitData: Partial<IHealthUnit>;
}

export interface IHealthUnitRepository {
  createHealthUnit(
    healthUnitData: IParamsCreateHealthUnit,
  ): Promise<IHealthUnit>;
  updateHealthUnitById(
    id: string,
    params: IParamsUpdateHealthUnit,
  ): Promise<IHealthUnit | null>;
  deleteHealthUnitById(id: string): Promise<IHealthUnit | null>;
  getHealthUnitByEmail(email: string): Promise<IHealthUnit | null>;
  getHealthUnitById(id: string): Promise<IHealthUnit | null>;
  listHealthUnits(filter: Partial<IHealthUnit>): Promise<IHealthUnit[]>;
}
