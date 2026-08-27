import { IHealthUnitOpeningHours, WeekDay } from '../interfaces/health-unit.interface';
import { toBrazilDate } from '../../../shared/utils/brazilTime';

const WEEKDAYS_BY_JS_INDEX: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isHealthUnitOpenAt(
  openingHours: IHealthUnitOpeningHours[],
  date: Date,
): boolean {
  const brazilTime = toBrazilDate(date);
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
