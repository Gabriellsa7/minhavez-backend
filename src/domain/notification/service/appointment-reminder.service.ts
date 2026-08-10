import { IAppointment } from '../../appointment/interfaces/appointment.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { ENotificationType } from '../interfaces/notification.interface';
import { notificationConfig } from '../../../infrastructure/config/notification.constants';

export interface IParamsAppointmentReminderService {
  notificationService: Pick<INotificationService, 'createNotification'>;
}

interface IReminderWindow {
  daysBefore: number;
  label: string;
}

const REMINDER_WINDOWS: IReminderWindow[] = [
  { daysBefore: 2, label: 'em 2 dias' },
  { daysBefore: 1, label: 'amanhã' },
  { daysBefore: 0, label: 'hoje' },
];

const REMINDER_HOUR = 9;

type EDayComparison = 'past' | 'today' | 'future';

export class AppointmentReminderService {
  private readonly notificationService: Pick<
    INotificationService,
    'createNotification'
  >;

  constructor(params: IParamsAppointmentReminderService) {
    this.notificationService = params.notificationService;
  }

  async createReminders(appointment: IAppointment): Promise<void> {
    const appointmentDateTime = new Date(appointment.dateTime);
    const today = new Date();

    for (const { daysBefore, label } of REMINDER_WINDOWS) {
      const targetDay = new Date(appointmentDateTime);
      targetDay.setDate(targetDay.getDate() - daysBefore);

      const dayComparison = this.compareDay(targetDay, today);
      // A window whose day already passed no longer applies — e.g. booking
      // on the day of the appointment must only produce the "hoje" reminder.
      if (dayComparison === 'past') {
        continue;
      }

      const scheduledAt =
        dayComparison === 'today'
          ? new Date()
          : new Date(
              targetDay.getFullYear(),
              targetDay.getMonth(),
              targetDay.getDate(),
              REMINDER_HOUR,
              0,
              0,
            );

      await this.notificationService.createNotification({
        patientId: appointment.patientId,
        title: 'Lembrete de consulta',
        message: `Sua consulta é ${label} (${appointmentDateTime.toLocaleString()}).`,
        type: ENotificationType.REMINDER,
        priority: notificationConfig.priorities.reminder,
        appointmentId: appointment._id,
        scheduledAt,
      });
    }
  }

  private compareDay(date: Date, reference: Date): EDayComparison {
    const target = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ).getTime();
    const ref = new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate(),
    ).getTime();

    if (target < ref) return 'past';
    if (target === ref) return 'today';
    return 'future';
  }
}
