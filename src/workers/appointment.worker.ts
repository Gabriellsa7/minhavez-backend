import 'dotenv/config';
import { AppointmentWorker } from '../infrastructure/queue/bullmq/workers/appointment.worker';

const worker = new AppointmentWorker();
worker.start();
