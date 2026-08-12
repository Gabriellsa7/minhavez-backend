import { WeekDay } from '../../health-unit/interfaces/health-unit.interface';
import { IExamAvailabilityRule } from '../../exam-availability/interfaces/exam-availability.interface';

export const WEEKDAYS_BY_JS_INDEX: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

export function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toHHmm(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function generateSlotTimes(rule: IExamAvailabilityRule): string[] {
  const start = toMinutes(rule.startTime);
  const end = toMinutes(rule.endTime);
  const times: string[] = [];

  for (
    let cursor = start;
    cursor + rule.slotDurationMinutes <= end;
    cursor += rule.slotDurationMinutes
  ) {
    times.push(toHHmm(cursor));
  }

  return times;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function buildSlotKey(healthUnitId: string, scheduledAt: Date): string {
  return `${healthUnitId}_${scheduledAt.toISOString()}`;
}
