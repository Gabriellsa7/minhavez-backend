export const BRAZIL_UTC_OFFSET_HOURS = 3;

export function toBrazilDate(date: Date): Date {
  return new Date(date.getTime() - BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}

export function isSameBrazilDay(a: Date, b: Date): boolean {
  const brazilA = toBrazilDate(a);
  const brazilB = toBrazilDate(b);

  return (
    brazilA.getUTCFullYear() === brazilB.getUTCFullYear() &&
    brazilA.getUTCMonth() === brazilB.getUTCMonth() &&
    brazilA.getUTCDate() === brazilB.getUTCDate()
  );
}

export function toBrazilDayStart(date: Date): Date {
  const shifted = toBrazilDate(date);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ) +
      BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
}

export function fromBrazilWallClock(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) +
      BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
}

export function formatBrazilDateTime(date: Date): string {
  const shifted = toBrazilDate(date);
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const year = shifted.getUTCFullYear();
  const hours = String(shifted.getUTCHours()).padStart(2, '0');
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
