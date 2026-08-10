import { IAppointment } from '../../appointment/interfaces/appointment.interface';
import { INotificationService } from '../interfaces/notification.service.interface';
import { ENotificationType } from '../interfaces/notification.interface';
import { notificationConfig } from '../../../infrastructure/config/notification.constants';

export interface IParamsAppointmentReminderService {
  notificationService: Pick<INotificationService, 'createNotification'>;
}

export class AppointmentReminderService {
  private readonly notificationService: Pick<
    INotificationService,
    'createNotification'
  >;

  constructor(params: IParamsAppointmentReminderService) {
    this.notificationService = params.notificationService;
  }

  async createReminders(appointment: IAppointment): Promise<void> {
    const reminderOffsets: Array<{ offset: number; label: string }> = [
      { offset: 2 * 24 * 60 * 60 * 1000, label: 'em 2 dias' },
      { offset: 24 * 60 * 60 * 1000, label: 'amanhã' },
      { offset: 60 * 60 * 1000, label: 'em 1 hora' },
      { offset: 0, label: 'agora' },
    ];

    for (const { offset, label } of reminderOffsets) {
      const scheduledAt = new Date(
        new Date(appointment.dateTime).getTime() - offset,
      );
      if (scheduledAt.getTime() <= Date.now()) {
        continue;
      }

      await this.notificationService.createNotification({
        patientId: appointment.patientId,
        title: 'Lembrete de consulta',
        message: `Sua consulta é ${label} (${appointment.dateTime.toLocaleString()}).`,
        type: ENotificationType.REMINDER,
        priority: notificationConfig.priorities.reminder,
        appointmentId: appointment._id,
        scheduledAt: scheduledAt,
      });
    }
  }
}
