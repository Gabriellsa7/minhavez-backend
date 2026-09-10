import { Queue } from 'bullmq';
import { Logger } from 'traceability';
import { queueWindowPromotionConfig } from '../../config/queue-window-promotion.constants';
import { BullMqProvider } from './bullmq.provider';

export class QueueWindowPromotionScheduler {
  private readonly queue: Queue;

  constructor(queue?: Queue) {
    this.queue =
      queue ??
      new BullMqProvider().createQueue(queueWindowPromotionConfig.queueName);
  }

  async registerRepeatableJob(): Promise<void> {
    await this.queue.upsertJobScheduler(
      queueWindowPromotionConfig.schedulerId,
      { every: queueWindowPromotionConfig.everyMs },
      { name: queueWindowPromotionConfig.jobName },
    );

    Logger.info('Queue window promotion scheduled job registered', {
      queue: queueWindowPromotionConfig.queueName,
      everyMs: queueWindowPromotionConfig.everyMs,
    });
  }
}
