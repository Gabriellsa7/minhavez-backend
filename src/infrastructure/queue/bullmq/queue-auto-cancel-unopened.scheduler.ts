import { Queue } from 'bullmq';
import { Logger } from 'traceability';
import { queueAutoCancelUnopenedConfig } from '../../config/queue-auto-cancel-unopened.constants';
import { BullMqProvider } from './bullmq.provider';

export class QueueAutoCancelUnopenedScheduler {
  private readonly queue: Queue;

  constructor(queue?: Queue) {
    this.queue =
      queue ??
      new BullMqProvider().createQueue(
        queueAutoCancelUnopenedConfig.queueName,
      );
  }

  /** upsertJobScheduler is idempotent by scheduler id, so calling this on
   * every process boot never creates duplicate repeatable jobs. */
  async registerRepeatableJob(): Promise<void> {
    await this.queue.upsertJobScheduler(
      queueAutoCancelUnopenedConfig.schedulerId,
      { every: queueAutoCancelUnopenedConfig.everyMs },
      { name: queueAutoCancelUnopenedConfig.jobName },
    );

    Logger.info('Queue auto-cancel-unopened scheduled job registered', {
      queue: queueAutoCancelUnopenedConfig.queueName,
      everyMs: queueAutoCancelUnopenedConfig.everyMs,
    });
  }
}
