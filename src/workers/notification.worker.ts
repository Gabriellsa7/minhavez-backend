import 'dotenv/config';
import { NotificationWorker } from '../infrastructure/queue/bullmq/workers/notification.worker';

const worker = new NotificationWorker();
worker.start();
