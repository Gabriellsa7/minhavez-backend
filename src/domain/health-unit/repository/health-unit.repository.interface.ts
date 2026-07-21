import {
  IHealthUnit,
  IHealthUnitAddress,
  IService,
} from '../interfaces/health-unit.interface';

export interface IParamsCreateHealthUnit {
  name: string;
  address: IHealthUnitAddress;
  phone: string;
  email: string;
  description?: string;
  services: IService[];
  img?: string;
}

export interface IHealthUnitRepository {
  createHealthUnit(
    healthUnitData: IParamsCreateHealthUnit,
  ): Promise<IHealthUnit>;
  updateHealthUnitById(
    id: string,
    params: Partial<IHealthUnit>,
  ): Promise<IHealthUnit | null>;
  deleteHealthUnitById(id: string): Promise<IHealthUnit | null>;
  getHealthUnitByEmail(email: string): Promise<IHealthUnit | null>;
  getHealthUnitById(id: string): Promise<IHealthUnit | null>;
  listHealthUnits(filter: Partial<IHealthUnit>): Promise<IHealthUnit[]>;
}
