import { Job, Worker } from 'bullmq';
import { Logger } from 'traceability';
import { QueueOrderingService } from '../../../../domain/queue-item/service/queue-ordering.service';
import { queueWindowPromotionConfig } from '../../../config/queue-window-promotion.constants';
import { BullMqProvider } from '../bullmq.provider';
import { WorkerStatusRegistry } from './worker-status.registry';

export class QueueWindowPromotionWorker {
  private readonly worker: Worker;

  constructor(queueOrderingService: QueueOrderingService) {
    const provider = new BullMqProvider();
    this.worker = provider.createWorker(
      queueWindowPromotionConfig.queueName,
      async (job: Job) => {
        Logger.info('Queue window promotion job started', { jobId: job.id });

        await queueOrderingService.promoteDueQueueItems();

        Logger.info('Queue window promotion job finished', { jobId: job.id });
      },
    );
  }

  start() {
    this.worker.on('ready', () => {
      WorkerStatusRegistry.started(queueWindowPromotionConfig.queueName);
      Logger.info('Queue window promotion worker started', {
        queue: queueWindowPromotionConfig.queueName,
      });
    });

    this.worker.on('completed', (job) => {
      WorkerStatusRegistry.completed(queueWindowPromotionConfig.queueName);
      Logger.info('Queue window promotion job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      WorkerStatusRegistry.failed(queueWindowPromotionConfig.queueName);
      Logger.error('Queue window promotion job failed', {
        jobId: job?.id,
        error: err.message,
      });
    });
  }
}
