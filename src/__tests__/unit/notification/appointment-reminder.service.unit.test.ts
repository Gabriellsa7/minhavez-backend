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
});
