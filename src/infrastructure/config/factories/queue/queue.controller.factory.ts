import { IController } from '../../../../interfaces/http/controllers/IController';
import { QueueController } from '../../../../interfaces/http/controllers/queue.controller';
import { QueueServiceFactory } from './queue.service.factory';

export class QueueControllerFactory {
  static create(): IController {
    return new QueueController(QueueServiceFactory.create());
  }
}
