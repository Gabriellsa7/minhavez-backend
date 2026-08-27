import { Job, Worker } from 'bullmq';
import { Logger } from 'traceability';
import { IQueueService } from '../../../../domain/queue/interfaces/queue.service.interface';
import { EQueueShift } from '../../../../domain/queue/interfaces/queue.interface';
import { queueAutoCloseConfig } from '../../../config/queue-auto-close.constants';
import { BullMqProvider } from '../bullmq.provider';
import { WorkerStatusRegistry } from './worker-status.registry';

export class QueueAutoCloseWorker {
  private readonly worker: Worker;

  constructor(queueService: IQueueService) {
    const provider = new BullMqProvider();
    this.worker = provider.createWorker(
      queueAutoCloseConfig.queueName,
      async (job: Job) => {
        Logger.info('Queue auto-close job started', {
          jobId: job.id,
          jobName: job.name,
        });

        const shift =
          job.name === queueAutoCloseConfig.jobNames.closeAfternoonShift
            ? EQueueShift.AFTERNOON
            : EQueueShift.MORNING;

        await queueService.autoCloseQueuesForShift(shift);

        Logger.info('Queue auto-close job finished', {
          jobId: job.id,
          jobName: job.name,
        });
      },
    );
  }

  start() {
    this.worker.on('ready', () => {
      WorkerStatusRegistry.started(queueAutoCloseConfig.queueName);
      Logger.info('Queue auto-close worker started', {
        queue: queueAutoCloseConfig.queueName,
      });
    });

    this.worker.on('completed', (job) => {
      WorkerStatusRegistry.completed(queueAutoCloseConfig.queueName);
      Logger.info('Queue auto-close job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      WorkerStatusRegistry.failed(queueAutoCloseConfig.queueName);
      Logger.error('Queue auto-close job failed', {
        jobId: job?.id,
        error: err.message,
      });
    });
  }
}
