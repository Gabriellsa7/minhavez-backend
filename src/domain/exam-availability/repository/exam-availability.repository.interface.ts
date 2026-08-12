import {
  IExamAvailabilityBlackout,
  IExamAvailabilityRule,
  WeekDay,
} from '../interfaces/exam-availability.interface';

export interface IParamsUpsertExamAvailabilityRule {
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacityPerSlot: number;
  isActive?: boolean;
}

export interface IExamAvailabilityRepository {
  replaceRulesForHealthUnit(
    healthUnitId: string,
    rules: IParamsUpsertExamAvailabilityRule[],
  ): Promise<IExamAvailabilityRule[]>;
  listRulesByHealthUnitId(
    healthUnitId: string,
  ): Promise<IExamAvailabilityRule[]>;
  createBlackout(
    healthUnitId: string,
    date: Date,
    reason?: string,
  ): Promise<IExamAvailabilityBlackout>;
  getBlackoutById(id: string): Promise<IExamAvailabilityBlackout | null>;
  deleteBlackoutById(id: string): Promise<void>;
  listBlackoutsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IExamAvailabilityBlackout[]>;
  isDateBlackedOut(healthUnitId: string, date: Date): Promise<boolean>;
}
