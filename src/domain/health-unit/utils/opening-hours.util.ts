import { IHealthUnitOpeningHours, WeekDay } from '../interfaces/health-unit.interface';

const WEEKDAYS_BY_JS_INDEX: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

/** Brazil (America/Sao_Paulo) has used a fixed UTC-3 offset since abolishing
 * DST in 2019, so this shift is safe year-round. A fixed offset is used
 * instead of process-local Date methods so this stays correct regardless of
 * the process's TZ env var (production sets TZ=America/Sao_Paulo, but the
 * unit test runner forces TZ=UTC). */
const BRAZIL_UTC_OFFSET_HOURS = 3;

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isHealthUnitOpenAt(
  openingHours: IHealthUnitOpeningHours[],
  date: Date,
): boolean {
  const brazilTime = new Date(
    date.getTime() - BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
  const weekday = WEEKDAYS_BY_JS_INDEX[brazilTime.getUTCDay()];
  const minutesOfDay = brazilTime.getUTCHours() * 60 + brazilTime.getUTCMinutes();

  const dayHours = openingHours.find((entry) => entry.day === weekday);

  if (!dayHours || dayHours.isClosed || !dayHours.open || !dayHours.close) {
    return false;
  }

  return (
    minutesOfDay >= toMinutes(dayHours.open) &&
    minutesOfDay < toMinutes(dayHours.close)
  );
}
