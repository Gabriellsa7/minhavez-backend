import { IAppointment } from '../../appointment/interfaces/appointment.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { ENotificationType } from '../interfaces/notification.interface';
import { notificationConfig } from '../../../infrastructure/config/notification.constants';
import {
  formatBrazilDateTime,
  toBrazilDayStart,
} from '../../../shared/utils/brazilTime';

export interface IParamsAppointmentReminderService {
  notificationService: Pick<
    INotificationService,
    'createNotification' | 'cancelPendingNotificationsForAppointment'
  >;
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
// The same-day reminder must arrive before an early appointment, but not at night.
const SAME_DAY_LEAD_MS = 2 * 60 * 60 * 1000;
const EARLIEST_REMINDER_HOUR = 6;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type EDayComparison = 'past' | 'today' | 'future';

export class AppointmentReminderService {
  private readonly notificationService: IParamsAppointmentReminderService['notificationService'];

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

      const dayComparison = this.compareDay(
        targetDayStart,
        todayBrazilDayStart,
      );

      if (dayComparison === 'past') {
        continue;
      }

      const scheduledAt =
        dayComparison === 'today'
          ? new Date()
          : this.reminderTime(targetDayStart, daysBefore, appointmentDateTime);

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

  async cancelReminders(appointmentId: string): Promise<void> {
    await this.notificationService.cancelPendingNotificationsForAppointment(
      appointmentId,
    );
  }

  private reminderTime(
    targetDayStart: Date,
    daysBefore: number,
    appointmentDateTime: Date,
  ): Date {
    const atReminderHour =
      targetDayStart.getTime() + REMINDER_HOUR * ONE_HOUR_MS;
    if (daysBefore > 0) return new Date(atReminderHour);

    return new Date(
      Math.max(
        Math.min(
          atReminderHour,
          appointmentDateTime.getTime() - SAME_DAY_LEAD_MS,
        ),
        targetDayStart.getTime() + EARLIEST_REMINDER_HOUR * ONE_HOUR_MS,
      ),
    );
  }

  private compareDay(target: Date, reference: Date): EDayComparison {
    const targetTime = target.getTime();
    const refTime = reference.getTime();

    if (targetTime < refTime) return 'past';
    if (targetTime === refTime) return 'today';
    return 'future';
  }
}
