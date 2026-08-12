import {
  IExamAvailabilityBlackout,
  IExamAvailabilityRule,
} from './exam-availability.interface';
import {
  IExamAvailabilityRepository,
  IParamsUpsertExamAvailabilityRule,
} from '../repository/exam-availability.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';

export interface IParamsExamAvailabilityService {
  examAvailabilityRepository: IExamAvailabilityRepository;
  healthUnitRepository: IHealthUnitRepository;
}

export interface IExamAvailabilityService {
  upsertRules(
    healthUnitId: string,
    rules: IParamsUpsertExamAvailabilityRule[],
    requestingAdminUserId: string,
  ): Promise<IExamAvailabilityRule[]>;
  listRulesByHealthUnitId(
    healthUnitId: string,
  ): Promise<IExamAvailabilityRule[]>;
  addBlackout(
    healthUnitId: string,
    date: Date,
    reason: string | undefined,
    requestingAdminUserId: string,
  ): Promise<IExamAvailabilityBlackout>;
  removeBlackout(id: string, requestingAdminUserId: string): Promise<void>;
  listBlackoutsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IExamAvailabilityBlackout[]>;
}
