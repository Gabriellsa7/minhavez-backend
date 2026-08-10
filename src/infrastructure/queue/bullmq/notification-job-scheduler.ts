import { Queue } from 'bullmq';
import { Logger } from 'traceability';
import { INotificationJobScheduler } from '../../../domain/notification/interfaces/notification-job-scheduler.interface';
import { notificationQueueConfig } from '../../config/notification.constants';
import { BullMqProvider } from './bullmq.provider';

export class NotificationJobScheduler implements INotificationJobScheduler {
  private readonly queue: Queue;

  constructor(queue?: Queue) {
    this.queue =
      queue ??
      new BullMqProvider().createQueue(
        notificationQueueConfig.queueNames.notification,
      );
  }

  async enqueue(payload: {
    notificationId: string;
    patientId: string;
    appointmentId?: string;
    scheduledAt?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<{ jobId: string; queue: string }> {
    const delay = payload.scheduledAt
      ? Math.max(0, payload.scheduledAt.getTime() - Date.now())
      : notificationQueueConfig.defaultJobOptions.delay;

    const job = await this.queue.add(
      'send-notification',
      {
        notificationId: payload.notificationId,
        patientId: payload.patientId,
        appointmentId: payload.appointmentId,
        metadata: payload.metadata,
      },
      {
        priority: notificationQueueConfig.priorities.default,
        attempts: notificationQueueConfig.defaultJobOptions.attempts,
        backoff: notificationQueueConfig.defaultJobOptions.backoff,
        delay,
      },
    );
    Logger.info('Notification job created', {
      jobId: job.id,
      queue: this.queue.name,
      notificationId: payload.notificationId,
      patientId: payload.patientId,
      appointmentId: payload.appointmentId,
      delay,
    });
    return { jobId: String(job.id), queue: this.queue.name };
  }

  async enqueueAppointmentReminder(payload: {
    appointmentId: string;
    patientId: string;
    dateTime: Date;
  }): Promise<void> {
    await this.queue.add('appointment-reminder', payload, {
      priority: notificationQueueConfig.priorities.high,
      attempts: notificationQueueConfig.defaultJobOptions.attempts,
      backoff: notificationQueueConfig.defaultJobOptions.backoff,
      delay: notificationQueueConfig.defaultJobOptions.delay,
    });
    Logger.info('Appointment reminder job created', {
      appointmentId: payload.appointmentId,
      patientId: payload.patientId,
    });
  }

  async enqueueReceipt(notificationId: string): Promise<void> {
    const job = await this.queue.add(
      'check-notification-receipt',
      { notificationId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 30000 },
        delay: 60000,
      },
    );
    Logger.info('Expo receipt job created', { jobId: job.id, notificationId });
  }

  async cancelJobsForAppointment(appointmentId: string): Promise<void> {
    const jobs = await this.queue.getJobs(['waiting', 'active', 'delayed']);
    const matching = jobs.filter(
      (job) => job.data.appointmentId === appointmentId,
    );
    await Promise.all(matching.map((job) => job.remove()));
    Logger.info('Appointment jobs cancelled', {
      appointmentId,
      count: matching.length,
    });
  }
}
