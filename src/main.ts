import path from 'path';
import { Server } from './interfaces/http/server';

import { UserControllerFactory } from './infrastructure/config/factories/user/user.controller.factory';

const OPEN_API_SPEC_FILE_LOCATION = path.resolve(
  __dirname,
  './contracts/service.yaml',
);

import 'dotenv/config';
import { HealthUnitControllerFactory } from './infrastructure/config/factories/health-unit/health-unit.controller.factory';
import { PatientControllerFactory } from './infrastructure/config/factories/patient/patient.controller.factory';
import { HealthProfessionalControllerFactory } from './infrastructure/config/factories/health-professional/health-professional.controller.factory';
import { QueueControllerFactory } from './infrastructure/config/factories/queue/queue.controller.factory';
import { QueueItemControllerFactory } from './infrastructure/config/factories/queue-item/queue-item.controller.factory';
import { NotificationControllerFactory } from './infrastructure/config/factories/notification/notification.controller.factory';
import { AppointmentControllerFactory } from './infrastructure/config/factories/appointment/appointment.controller.factory';
import { AuthControllerFactory } from './infrastructure/config/factories/auth/auth.controller.factory';
import { corsMiddleware } from './interfaces/http/middlewary/cors';

const app = new Server({
  port: Number(process.env.PORT) || 3000,
  middlewaresToStart: [corsMiddleware],
  controllers: [
    UserControllerFactory.create(),
    HealthUnitControllerFactory.create(),
    PatientControllerFactory.create(),
    HealthProfessionalControllerFactory.create(),
    QueueControllerFactory.create(),
    QueueItemControllerFactory.create(),
    NotificationControllerFactory.create(),
    AppointmentControllerFactory.create(),
    AuthControllerFactory.create(),
  ],
  databaseURI: process.env.DATABASE_URI,
  apiSpecLocation: OPEN_API_SPEC_FILE_LOCATION,
});

async function start() {
  app.databaseSetup();
  app.listen();
}

start();
