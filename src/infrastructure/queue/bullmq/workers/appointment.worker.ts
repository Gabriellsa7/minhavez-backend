import { Job, Worker } from 'bullmq';
import { Logger } from 'traceability';
import { AppointmentReminderService } from '../../../../domain/notification/service/appointment-reminder.service';
import { NotificationService } from '../../../../domain/notification/service/notification.service';
import { NotificationRepository } from '../../../repository/notification/notification.repository';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';
import { BullMqProvider } from '../bullmq.provider';
import { notificationQueueConfig } from '../../../config/notification.constants';
import { WorkerStatusRegistry } from './worker-status.registry';
import { NotificationJobScheduler } from '../notification-job-scheduler';

export class AppointmentWorker {
  private readonly worker: Worker;

  constructor() {
    const provider = new BullMqProvider();
    this.worker = provider.createWorker(
      notificationQueueConfig.queueNames.appointment,
      async (job: Job) => {
        Logger.info('Appointment worker started', { jobId: job.id });
        const notificationService = new NotificationService({
          notificationRepository: new NotificationRepository(),
          notificationJobScheduler: new NotificationJobScheduler(),
        });
        const appointmentReminderService = new AppointmentReminderService({
          notificationService,
        });
        const appointmentRepository = new AppointmentRepository();
        const appointment = await appointmentRepository.getAppointmentById(
          job.data.appointmentId,
        );
        if (!appointment) {
          return;
        }
        await appointmentReminderService.createReminders(appointment);
      },
    );
  }

  start() {
    this.worker.on('ready', () => {
      WorkerStatusRegistry.started(notificationQueueConfig.queueNames.appointment);
      Logger.info('Appointment worker started', {
        queue: notificationQueueConfig.queueNames.appointment,
      });
    });

    this.worker.on('completed', (job) => {
      WorkerStatusRegistry.completed(notificationQueueConfig.queueNames.appointment);
      Logger.info('Appointment job completed', { jobId: job.id });
    });
  }
}
