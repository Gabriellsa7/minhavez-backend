import { WeekDay } from '../../health-unit/interfaces/health-unit.interface';

export interface IExamAvailabilityRule {
  _id: string;
  healthUnitId: string;
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacityPerSlot: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExamAvailabilityBlackout {
  _id: string;
  healthUnitId: string;
  date: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export { WeekDay };
