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

const app = new Server({
  port: Number(process.env.PORT) || 3000,
  controllers: [
    UserControllerFactory.create(),
    HealthUnitControllerFactory.create(),
    PatientControllerFactory.create(),
    HealthProfessionalControllerFactory.create(),
    QueueControllerFactory.create(),
  ],
  databaseURI: process.env.DATABASE_URI,
  apiSpecLocation: OPEN_API_SPEC_FILE_LOCATION,
});

async function start() {
  app.databaseSetup();
  app.listen();
}

start();
