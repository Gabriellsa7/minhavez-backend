export function generateTimeSlots(
  start: string,
  end: string,
  durationMinutes: number,
): string[] {
  if (!start || !end || !durationMinutes) return [];

  const times: string[] = [];

  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  let current = startHour * 60 + startMinute;
  const finish = endHour * 60 + endMinute;

  while (current + durationMinutes <= finish) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;

    times.push(
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    );

    current += durationMinutes;
  }

  return times;
}

export function parseDateKey(dateKey: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = dateKey.split('-').map(Number);
  return { year, month, day };
}
