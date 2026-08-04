import { Job, Worker } from 'bullmq';
import { Logger } from 'traceability';
import { NotificationService } from '../../../../domain/notification/service/notification.service';
import { NotificationRepository } from '../../../repository/notification/notification.repository';
import { ExpoNotificationProvider } from '../../../external/expo/expo-notification.provider';
import { BullMqProvider } from '../bullmq.provider';
import { notificationQueueConfig } from '../../../config/notification.constants';
import { WorkerStatusRegistry } from './worker-status.registry';

export class NotificationWorker {
  private readonly worker: Worker;

  constructor() {
    const provider = new BullMqProvider();
    this.worker = provider.createWorker(
      notificationQueueConfig.queueNames.notification,
      async (job: Job) => {
        Logger.info('Notification worker started', {
          jobId: job.id,
          notificationId: job.data.notificationId,
          attempt: job.attemptsMade,
        });

        const notificationService = new NotificationService({
          notificationRepository: new NotificationRepository(),
          notificationProvider: new ExpoNotificationProvider(),
        });

        await notificationService.processNotification(job.data.notificationId);
        Logger.info('Notification worker finished', {
          jobId: job.id,
          notificationId: job.data.notificationId,
        });
      },
    );
  }

  start() {
    this.worker.on('ready', () => {
      WorkerStatusRegistry.started(notificationQueueConfig.queueNames.notification);
      Logger.info('Notification worker started', {
        queue: notificationQueueConfig.queueNames.notification,
      });
    });

    this.worker.on('completed', (job) => {
      WorkerStatusRegistry.completed(notificationQueueConfig.queueNames.notification);
      Logger.info('Job completed', { jobId: job.id });
    });

    this.worker.on('failed', async (job, err) => {
      WorkerStatusRegistry.failed(notificationQueueConfig.queueNames.notification);
      Logger.error('Job failed', { jobId: job?.id, error: err.message });
      if (!job) {
        return;
      }

      const maxAttempts = job.opts.attempts ?? 1;
      if (job.attemptsMade < maxAttempts) {
        Logger.info('Notification job retry scheduled', {
          jobId: job.id,
          attempt: job.attemptsMade,
          maxAttempts,
        });
        return;
      }

      const failedQueue = new BullMqProvider().createQueue(
        notificationQueueConfig.queueNames.failed,
      );
      await failedQueue.add('failed-notification', {
        ...job.data,
        error: err.message,
        failedAt: new Date().toISOString(),
      });
      Logger.error('Notification job moved to DLQ', {
        jobId: job.id,
        queue: notificationQueueConfig.queueNames.failed,
      });
    });
  }
}
