import { calculateAge } from '../../shared/utils/calculateAge';

describe('calculateAge', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts a full year once the birthday has passed this year', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T12:00:00.000Z'));

    expect(calculateAge('1960-08-17')).toBe(66);
    expect(calculateAge('1960-08-18')).toBe(66);
  });

  it('does not count this year until the birthday arrives', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T12:00:00.000Z'));

    expect(calculateAge('1960-08-19')).toBe(65);
  });

  it('returns 0 for an unparsable birth date', () => {
    expect(calculateAge('')).toBe(0);
  });
});
