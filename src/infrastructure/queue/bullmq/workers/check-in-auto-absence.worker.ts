import { Job, Worker } from 'bullmq';
import { Logger } from 'traceability';
import { IQueueItemService } from '../../../../domain/queue-item/interfaces/queue-item.service.interface';
import { checkInAutoAbsenceConfig } from '../../../config/check-in-auto-absence.constants';
import { BullMqProvider } from '../bullmq.provider';
import { WorkerStatusRegistry } from './worker-status.registry';

export class CheckInAutoAbsenceWorker {
  private readonly worker: Worker;

  constructor(queueItemService: IQueueItemService) {
    const provider = new BullMqProvider();
    this.worker = provider.createWorker(
      checkInAutoAbsenceConfig.queueName,
      async (job: Job) => {
        Logger.info('Check-in auto-absence job started', { jobId: job.id });

        const marked = await queueItemService.markMissedCheckInsAsAbsent();

        Logger.info('Check-in auto-absence job finished', {
          jobId: job.id,
          markedAbsentCount: marked.length,
        });
      },
    );
  }

  start() {
    this.worker.on('ready', () => {
      WorkerStatusRegistry.started(checkInAutoAbsenceConfig.queueName);
      Logger.info('Check-in auto-absence worker started', {
        queue: checkInAutoAbsenceConfig.queueName,
      });
    });

    this.worker.on('completed', (job) => {
      WorkerStatusRegistry.completed(checkInAutoAbsenceConfig.queueName);
      Logger.info('Check-in auto-absence job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      WorkerStatusRegistry.failed(checkInAutoAbsenceConfig.queueName);
      Logger.error('Check-in auto-absence job failed', {
        jobId: job?.id,
        error: err.message,
      });
    });
  }
}
