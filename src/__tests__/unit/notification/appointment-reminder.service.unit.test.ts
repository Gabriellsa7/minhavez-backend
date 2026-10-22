import {
  AppointmentReminderService,
  IParamsAppointmentReminderService,
} from '../../../domain/notification/service/appointment-reminder.service';
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
      notificationService: {
        createNotification,
      } as unknown as IParamsAppointmentReminderService['notificationService'],
    });

    const appointment = createAppointment(addDays(new Date(), 5));

    await service.createReminders(appointment);

    expect(createNotification).toHaveBeenCalledTimes(3);
    const messages = createNotification.mock.calls.map(
      (call) => call[0].message,
    );
    expect(
      messages.some((message: string) => message.includes('em 2 dias')),
    ).toBe(true);
    expect(messages.some((message: string) => message.includes('amanhã'))).toBe(
      true,
    );
    expect(messages.some((message: string) => message.includes('hoje'))).toBe(
      true,
    );
  });

  it('only sends the "amanhã" and "hoje" reminders when the appointment is tomorrow', async () => {
    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new AppointmentReminderService({
      notificationService: {
        createNotification,
      } as unknown as IParamsAppointmentReminderService['notificationService'],
    });

    const appointment = createAppointment(addDays(new Date(), 1));

    await service.createReminders(appointment);

    expect(createNotification).toHaveBeenCalledTimes(2);
    const messages = createNotification.mock.calls.map(
      (call) => call[0].message,
    );
    expect(
      messages.some((message: string) => message.includes('em 2 dias')),
    ).toBe(false);
    expect(messages.some((message: string) => message.includes('amanhã'))).toBe(
      true,
    );
    expect(messages.some((message: string) => message.includes('hoje'))).toBe(
      true,
    );
  });

  it('only sends the "hoje" reminder when the appointment is booked for today', async () => {
    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new AppointmentReminderService({
      notificationService: {
        createNotification,
      } as unknown as IParamsAppointmentReminderService['notificationService'],
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
    jest.useFakeTimers().setSystemTime(new Date('2026-08-28T02:00:00.000Z'));

    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new AppointmentReminderService({
      notificationService: {
        createNotification,
      } as unknown as IParamsAppointmentReminderService['notificationService'],
    });

    const appointment = createAppointment(new Date('2026-08-28T14:00:00.000Z'));

    await service.createReminders(appointment);

    expect(createNotification).toHaveBeenCalledTimes(2);
    const calls = createNotification.mock.calls.map((call) => call[0]);
    const amanha = calls.find((call) => call.message.includes('amanhã'));
    const hoje = calls.find((call) => call.message.includes('hoje'));
    expect(amanha).toBeDefined();
    expect(hoje).toBeDefined();

    expect(amanha!.scheduledAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(hoje!.scheduledAt.getTime()).toBeGreaterThan(Date.now());

    expect(hoje!.scheduledAt.toISOString()).toBe('2026-08-28T12:00:00.000Z');

    jest.useRealTimers();
  });

  it('sends the "hoje" reminder before an early appointment instead of at 9h', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-26T13:00:00.000Z'));

    const createNotification = jest
      .fn()
      .mockResolvedValue({ _id: 'notification-1' });
    const service = new AppointmentReminderService({
      notificationService: {
        createNotification,
      } as unknown as IParamsAppointmentReminderService['notificationService'],
    });

    // 08:00 in Brazil: the reminder goes out at 06:00, not after the appointment.
    await service.createReminders(
      createAppointment(new Date('2026-08-30T11:00:00.000Z')),
    );

    const hoje = createNotification.mock.calls
      .map((call) => call[0])
      .find((call) => call.message.includes('hoje'));
    expect(hoje.scheduledAt.toISOString()).toBe('2026-08-30T09:00:00.000Z');

    jest.useRealTimers();
  });

  it('cancels the pending reminders of an appointment', async () => {
    const cancelPendingNotificationsForAppointment = jest.fn();
    const service = new AppointmentReminderService({
      notificationService: {
        cancelPendingNotificationsForAppointment,
      } as unknown as IParamsAppointmentReminderService['notificationService'],
    });

    await service.cancelReminders('appointment-1');

    expect(cancelPendingNotificationsForAppointment).toHaveBeenCalledWith(
      'appointment-1',
    );
  });
});
