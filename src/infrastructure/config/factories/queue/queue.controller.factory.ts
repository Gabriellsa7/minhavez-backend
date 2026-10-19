import { IController } from '../../../../interfaces/http/controllers/IController';
import { QueueController } from '../../../../interfaces/http/controllers/queue.controller';
import { QueueServiceFactory } from './queue.service.factory';
import { PatientServiceFactory } from '../patient/patient.service.factory';

export class QueueControllerFactory {
  static create(): IController {
    return new QueueController(
      QueueServiceFactory.create(),
      PatientServiceFactory.create(),
    );
  }
}
