import path from 'path';
import { Server } from './interfaces/http/server';

import { UserControllerFactory } from './infrastructure/config/factories/user/user.controller.factory';

const OPEN_API_SPEC_FILE_LOCATION = path.resolve(
  __dirname,
  './contracts/service.yaml',
);

import 'dotenv/config';
import { HealthUnitControllerFactory } from './infrastructure/config/factories/health-unit/health-unit.controller.factory';

const app = new Server({
  port: Number(process.env.PORT) || 3000,
  controllers: [
    UserControllerFactory.create(),
    HealthUnitControllerFactory.create(),
  ],
  databaseURI: process.env.DATABASE_URI,
  apiSpecLocation: OPEN_API_SPEC_FILE_LOCATION,
});

async function start() {
  app.databaseSetup();
  app.listen();
}

start();
