import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { Request, Response, Router } from 'express';
import mongoose, { Types } from 'mongoose';
import { IController } from './IController';
import { QueueMonitoringService } from '../../../infrastructure/queue/bullmq/queue-monitoring.service';
import { NotificationService } from '../../../domain/notification/service/notification.service';
import { NotificationRepository } from '../../../infrastructure/repository/notification/notification.repository';
import { NotificationJobScheduler } from '../../../infrastructure/queue/bullmq/notification-job-scheduler';
import { ENotificationType } from '../../../domain/notification/interfaces/notification.interface';

export class InfrastructureController implements IController {
  router: Router;
  private readonly monitoring: QueueMonitoringService;
  private readonly debugNotificationService: NotificationService;
  private readonly notificationJobScheduler: NotificationJobScheduler;

  constructor(monitoring = new QueueMonitoringService()) {
    this.router = Router();
    this.monitoring = monitoring;
    this.debugNotificationService = new NotificationService({
      notificationRepository: new NotificationRepository(),
    });
    this.notificationJobScheduler = new NotificationJobScheduler();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get('/health', this.getHealth);
    this.router.get('/health/redis', this.getRedisHealth);
    this.router.get('/health/bullmq', this.getBullMqHealth);
    this.router.get('/health/queues', this.getQueueStatus);

    if (process.env.NODE_ENV !== 'production') {
      this.router.post('/debug/test-notification', this.createTestNotification);
    }

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    createBullBoard({
      queues: this.monitoring
        .getQueues()
        .map((queue) => new BullMQAdapter(queue)),
      serverAdapter,
    });
    this.router.use('/admin/queues', serverAdapter.getRouter());
  }

  private getHealth = async (_req: Request, res: Response): Promise<void> => {
    const redis = await this.monitoring.getRedisStatus();
    const queueStatus = await this.monitoring.getQueueStatus().catch(() => ({
      queues: [],
      workers: [],
    }));
    const mongoConnected = mongoose.connection.readyState === 1;
    const healthy = mongoConnected && redis.connected;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'OK' : 'DEGRADED',
      mongo: { connected: mongoConnected },
      redis,
      bullmq: { connected: redis.connected, queues: queueStatus.queues },
      workers: queueStatus.workers,
    });
  };

  private getRedisHealth = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    const redis = await this.monitoring.getRedisStatus();
    res.status(redis.connected ? 200 : 503).json({ redis });
  };

  private getBullMqHealth = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    const redis = await this.monitoring.getRedisStatus();
    const status = await this.monitoring.getQueueStatus().catch(() => null);
    const healthy = redis.connected && status !== null;
    res.status(healthy ? 200 : 503).json({
      connected: healthy,
      queues: status?.queues ?? [],
      workers: status?.workers ?? [],
    });
  };

  private getQueueStatus = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      res.status(200).json(await this.monitoring.getQueueStatus());
    } catch (error) {
      res.status(503).json({ error: (error as Error).message });
    }
  };

  private createTestNotification = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const patientId = req.body.patientId || new Types.ObjectId().toString();
      const notification = await this.debugNotificationService.createNotification({
        patientId,
        title: 'Teste de infraestrutura',
        message: 'Notificação de validação do ambiente de desenvolvimento.',
        type: ENotificationType.REMINDER,
        metadata: { source: 'debug/test-notification' },
      });
      const job = await this.notificationJobScheduler.enqueue({
        notificationId: notification._id,
        patientId,
        metadata: { source: 'debug/test-notification' },
      });

      res.status(201).json({
        notificationId: notification._id,
        jobId: job.jobId,
        queue: job.queue,
        status: 'queued',
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getRoutes(): Router {
    return this.router;
  }
}
