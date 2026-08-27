import { AppointmentReminderService } from '../../../domain/notification/service/appointment-reminder.service';
import { INotificationService } from '../../../domain/notification/interfaces/notification.service.interface';
import { IAppointment } from '../../../domain/appointment/interfaces/appointment.interface';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function createAppointment(dateTime: Date): IAppointment {
  return {
    _id: 'appointment-1',
    patientId: 'patient-1',
    dateTime,
  } as IAppointment;
}

describe('AppointmentReminderService', () => {
  it('schedules the 2-days, tomorrow and today reminders when booked well in advance', async () => {
    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new AppointmentReminderService({
      notificationService: { createNotification } as unknown as Pick<INotificationService, 'createNotification'>,
    });

    const appointment = createAppointment(addDays(new Date(), 5));

    await service.createReminders(appointment);

    expect(createNotification).toHaveBeenCalledTimes(3);
    const messages = createNotification.mock.calls.map((call) => call[0].message);
    expect(messages.some((message: string) => message.includes('em 2 dias'))).toBe(true);
    expect(messages.some((message: string) => message.includes('amanhã'))).toBe(true);
    expect(messages.some((message: string) => message.includes('hoje'))).toBe(true);
  });

  it('only sends the "amanhã" and "hoje" reminders when the appointment is tomorrow', async () => {
    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new AppointmentReminderService({
      notificationService: { createNotification } as unknown as Pick<INotificationService, 'createNotification'>,
    });

    const appointment = createAppointment(addDays(new Date(), 1));

    await service.createReminders(appointment);

    expect(createNotification).toHaveBeenCalledTimes(2);
    const messages = createNotification.mock.calls.map((call) => call[0].message);
    expect(messages.some((message: string) => message.includes('em 2 dias'))).toBe(false);
    expect(messages.some((message: string) => message.includes('amanhã'))).toBe(true);
    expect(messages.some((message: string) => message.includes('hoje'))).toBe(true);
  });

  it('only sends the "hoje" reminder when the appointment is booked for today', async () => {
    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new AppointmentReminderService({
      notificationService: { createNotification } as unknown as Pick<INotificationService, 'createNotification'>,
    });

    const appointment = createAppointment(new Date());

    await service.createReminders(appointment);

    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('hoje'),
        scheduledAt: expect.any(Date),
      }),
    );
  });

  it('still schedules "amanhã" (not "hoje") for a tomorrow booking made late at night Brazil time', async () => {
    // 23:00 in Brazil (UTC-3) on 2026-08-27 is 02:00 UTC on 2026-08-28 — the
    // exact window where process-local Date getters, if evaluated under
    // UTC, would read "today" as one calendar day ahead of the real Brazil
    // day and misclassify the "amanhã" reminder as already past.
    jest.useFakeTimers().setSystemTime(new Date('2026-08-28T02:00:00.000Z'));

    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new AppointmentReminderService({
      notificationService: { createNotification } as unknown as Pick<INotificationService, 'createNotification'>,
    });

    // Booked for tomorrow in Brazil time: 2026-08-28 (Brazil calendar day),
    // i.e. any instant from 03:00 UTC on the 28th onward.
    const appointment = createAppointment(new Date('2026-08-28T14:00:00.000Z'));

    await service.createReminders(appointment);

    // Both the "amanhã" (fires now) and "hoje" (queued for tomorrow morning)
    // reminders must be created — under the bug, "amanhã" was dropped as
    // already "past" and "hoje" fired immediately instead of being queued.
    expect(createNotification).toHaveBeenCalledTimes(2);
    const calls = createNotification.mock.calls.map((call) => call[0]);
    const amanha = calls.find((call) => call.message.includes('amanhã'));
    const hoje = calls.find((call) => call.message.includes('hoje'));
    expect(amanha).toBeDefined();
    expect(hoje).toBeDefined();

    // "amanhã" is delivered right away; "hoje" must be queued for the next
    // Brazil calendar day, not fired immediately alongside it.
    expect(amanha!.scheduledAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(hoje!.scheduledAt.getTime()).toBeGreaterThan(Date.now());
    // 9am Brazil time on 2026-08-28 is 12:00:00.000Z.
    expect(hoje!.scheduledAt.toISOString()).toBe('2026-08-28T12:00:00.000Z');

    jest.useRealTimers();
  });
});
