/** Brazil (America/Sao_Paulo) has used a fixed UTC-3 offset since abolishing
 * DST in 2019, so this shift is safe year-round. A fixed offset is used
 * instead of process-local Date methods so this stays correct regardless of
 * the process's TZ env var (production sets TZ=America/Sao_Paulo, but the
 * unit test runner forces TZ=UTC). */
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

/** Midnight (00:00 Brazil time) of the given instant's Brazil calendar day,
 * represented as the equivalent UTC instant. Two dates on the same Brazil
 * calendar day always produce the same `getTime()` here, so this doubles as
 * a TZ-independent day bucket for ordering/equality comparisons — and, since
 * it's a real instant, days can be shifted with plain millisecond math
 * instead of local Date component setters. */
export function toBrazilDayStart(date: Date): Date {
  const shifted = toBrazilDate(date);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) +
      BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000,
  );
}

/** Formats an instant as its Brazil wall-clock date/time (dd/mm/yyyy HH:mm).
 * Built on the fixed offset rather than `toLocaleString`/`Intl` with an
 * explicit time zone, since that still depends on the ICU/tzdata being
 * available in the runtime — the same dependency this module exists to
 * avoid. */
export function formatBrazilDateTime(date: Date): string {
  const shifted = toBrazilDate(date);
  const day = String(shifted.getUTCDate()).padStart(2, '0');
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const year = shifted.getUTCFullYear();
  const hours = String(shifted.getUTCHours()).padStart(2, '0');
  const minutes = String(shifted.getUTCMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
