import { IAppointment } from '../../appointment/interfaces/appointment.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { ENotificationType } from '../interfaces/notification.interface';
import { notificationConfig } from '../../../infrastructure/config/notification.constants';
import { formatBrazilDateTime, toBrazilDayStart } from '../../../shared/utils/brazilTime';

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
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
    const appointmentBrazilDayStart = toBrazilDayStart(appointmentDateTime);
    const todayBrazilDayStart = toBrazilDayStart(new Date());

    for (const { daysBefore, label } of REMINDER_WINDOWS) {
      const targetDayStart = new Date(
        appointmentBrazilDayStart.getTime() - daysBefore * ONE_DAY_MS,
      );

      const dayComparison = this.compareDay(targetDayStart, todayBrazilDayStart);
      // A window whose day already passed no longer applies — e.g. booking
      // on the day of the appointment must only produce the "hoje" reminder.
      if (dayComparison === 'past') {
        continue;
      }

      const scheduledAt =
        dayComparison === 'today'
          ? new Date()
          : new Date(targetDayStart.getTime() + REMINDER_HOUR * 60 * 60 * 1000);

      await this.notificationService.createNotification({
        patientId: appointment.patientId,
        title: 'Lembrete de consulta',
        message: `Sua consulta é ${label} (${formatBrazilDateTime(appointmentDateTime)}).`,
        type: ENotificationType.REMINDER,
        priority: notificationConfig.priorities.reminder,
        appointmentId: appointment._id,
        scheduledAt,
      });
    }
  }

  private compareDay(target: Date, reference: Date): EDayComparison {
    const targetTime = target.getTime();
    const refTime = reference.getTime();

    if (targetTime < refTime) return 'past';
    if (targetTime === refTime) return 'today';
    return 'future';
  }
}
