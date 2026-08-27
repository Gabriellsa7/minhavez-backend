import { Queue } from 'bullmq';
import { Logger } from 'traceability';
import { queueAutoCloseConfig } from '../../config/queue-auto-close.constants';
import { BullMqProvider } from './bullmq.provider';

export class QueueAutoCloseScheduler {
  private readonly queue: Queue;

  constructor(queue?: Queue) {
    this.queue =
      queue ??
      new BullMqProvider().createQueue(queueAutoCloseConfig.queueName);
  }

  /** Registers the two daily scheduled jobs. upsertJobScheduler is
   * idempotent by scheduler id (it overrides in place), so calling this on
   * every process boot — or after a cron pattern changes between deploys —
   * never creates duplicate schedules. */
  async registerRepeatableJobs(): Promise<void> {
    await this.queue.upsertJobScheduler(
      queueAutoCloseConfig.jobNames.closeMorningShift,
      {
        pattern: queueAutoCloseConfig.cronPatterns.closeMorningShift,
        tz: queueAutoCloseConfig.timezone,
      },
      { name: queueAutoCloseConfig.jobNames.closeMorningShift },
    );

    await this.queue.upsertJobScheduler(
      queueAutoCloseConfig.jobNames.closeAfternoonShift,
      {
        pattern: queueAutoCloseConfig.cronPatterns.closeAfternoonShift,
        tz: queueAutoCloseConfig.timezone,
      },
      { name: queueAutoCloseConfig.jobNames.closeAfternoonShift },
    );

    Logger.info('Queue auto-close scheduled jobs registered', {
      queue: queueAutoCloseConfig.queueName,
      morning: queueAutoCloseConfig.cronPatterns.closeMorningShift,
      afternoon: queueAutoCloseConfig.cronPatterns.closeAfternoonShift,
      timezone: queueAutoCloseConfig.timezone,
    });
  }
}
