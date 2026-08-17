import 'dotenv/config';
import { configurePapertrailLogging } from '../infrastructure/logging/configure-papertrail';
import { NotificationWorker } from '../infrastructure/queue/bullmq/workers/notification.worker';

configurePapertrailLogging();

const worker = new NotificationWorker();
worker.start();
