import { Job, Worker } from 'bullmq';
import { Logger } from 'traceability';
import { IQueueService } from '../../../../domain/queue/interfaces/queue.service.interface';
import { queueAutoCancelUnopenedConfig } from '../../../config/queue-auto-cancel-unopened.constants';
import { BullMqProvider } from '../bullmq.provider';
import { WorkerStatusRegistry } from './worker-status.registry';

export class QueueAutoCancelUnopenedWorker {
  private readonly worker: Worker;

  constructor(queueService: IQueueService) {
    const provider = new BullMqProvider();
    this.worker = provider.createWorker(
      queueAutoCancelUnopenedConfig.queueName,
      async (job: Job) => {
        Logger.info('Queue auto-cancel-unopened job started', {
          jobId: job.id,
        });

        await queueService.autoCancelUnopenedQueues();

        Logger.info('Queue auto-cancel-unopened job finished', {
          jobId: job.id,
        });
      },
    );
  }

  start() {
    this.worker.on('ready', () => {
      WorkerStatusRegistry.started(queueAutoCancelUnopenedConfig.queueName);
      Logger.info('Queue auto-cancel-unopened worker started', {
        queue: queueAutoCancelUnopenedConfig.queueName,
      });
    });

    this.worker.on('completed', (job) => {
      WorkerStatusRegistry.completed(queueAutoCancelUnopenedConfig.queueName);
      Logger.info('Queue auto-cancel-unopened job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      WorkerStatusRegistry.failed(queueAutoCancelUnopenedConfig.queueName);
      Logger.error('Queue auto-cancel-unopened job failed', {
        jobId: job?.id,
        error: err.message,
      });
    });
  }
}
