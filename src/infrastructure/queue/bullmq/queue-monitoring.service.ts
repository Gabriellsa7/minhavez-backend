import { Queue } from 'bullmq';
import { notificationQueueConfig } from '../../config/notification.constants';
import { BullMqProvider } from './bullmq.provider';
import { WorkerStatusRegistry } from './workers/worker-status.registry';

const queueNames = Object.values(notificationQueueConfig.queueNames);

export class QueueMonitoringService {
  private readonly provider: BullMqProvider;
  private readonly queues: Queue[];

  constructor(provider = new BullMqProvider()) {
    this.provider = provider;
    this.queues = queueNames.map((name) => this.provider.createQueue(name));
  }

  getQueues(): Queue[] {
    return this.queues;
  }

  async getRedisStatus(): Promise<{ connected: boolean; response?: string }> {
    try {
      const response = await this.provider.ping();
      return { connected: response === 'PONG', response };
    } catch {
      return { connected: false };
    }
  }

  async getQueueStatus() {
    const queues = await Promise.all(
      this.queues.map(async (queue) => ({
        name: queue.name,
        jobs: await queue.getJobCounts(
          'waiting',
          'active',
          'delayed',
          'completed',
          'failed',
        ),
      })),
    );

    return { queues, workers: WorkerStatusRegistry.list() };
  }
}
