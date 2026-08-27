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
