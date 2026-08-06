import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';
import { Logger } from 'traceability';
import { notificationQueueConfig } from '../../config/notification.constants';

export class BullMqProvider {
  private static sharedConnection?: IORedis;
  private readonly connection: IORedis;

  constructor(connection?: IORedis) {
    this.connection = connection ?? BullMqProvider.getConnection();
  }

  createQueue(name: string) {
    return new Queue(name, {
      connection: this.connection,
      defaultJobOptions: notificationQueueConfig.defaultJobOptions,
    });
  }

  createWorker(name: string, processor: (job: Job) => Promise<void>) {
    return new Worker(name, processor, {
      connection: this.connection,
      autorun: true,
    });
  }

  createQueueEvents(name: string) {
    return new QueueEvents(name, { connection: this.connection });
  }

  async close() {
    await BullMqProvider.closeConnection();
  }

  async ping(): Promise<string> {
    return this.connection.ping();
  }

  static getConnection(): IORedis {
    if (!BullMqProvider.sharedConnection) {
      const options = BullMqProvider.getRedisOptions();
      BullMqProvider.sharedConnection = new IORedis(options);

      BullMqProvider.sharedConnection.on('connect', () => {
        Logger.info('Redis connected', {
          host: options.host ?? 'REDIS_URL',
          port: options.port,
        });
      });
      BullMqProvider.sharedConnection.on('error', (error) => {
        Logger.error('Redis connection failed', { error: error.message });
      });
    }

    return BullMqProvider.sharedConnection;
  }

  static async closeConnection(): Promise<void> {
    if (!BullMqProvider.sharedConnection) return;

    await BullMqProvider.sharedConnection.quit();
    BullMqProvider.sharedConnection = undefined;
  }

  private static getRedisOptions(): RedisOptions {
    return {
      host: process.env.REDIS_HOST || 'redis',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB || 0),
      // BullMQ Workers require this setting. The shared client is also used by
      // Queue and QueueEvents so every BullMQ component gets a compatible client.
      maxRetriesPerRequest: null,
    };
  }
}
