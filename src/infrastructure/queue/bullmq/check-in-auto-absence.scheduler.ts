import { Queue } from 'bullmq';
import { Logger } from 'traceability';
import { checkInAutoAbsenceConfig } from '../../config/check-in-auto-absence.constants';
import { BullMqProvider } from './bullmq.provider';

export class CheckInAutoAbsenceScheduler {
  private readonly queue: Queue;

  constructor(queue?: Queue) {
    this.queue =
      queue ??
      new BullMqProvider().createQueue(checkInAutoAbsenceConfig.queueName);
  }

  async registerRepeatableJob(): Promise<void> {
    await this.queue.upsertJobScheduler(
      checkInAutoAbsenceConfig.schedulerId,
      { every: checkInAutoAbsenceConfig.everyMs },
      { name: checkInAutoAbsenceConfig.jobName },
    );

    Logger.info('Check-in auto-absence scheduled job registered', {
      queue: checkInAutoAbsenceConfig.queueName,
      everyMs: checkInAutoAbsenceConfig.everyMs,
    });
  }
}
