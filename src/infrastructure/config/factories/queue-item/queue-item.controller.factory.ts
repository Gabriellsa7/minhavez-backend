import { IController } from '../../../../interfaces/http/controllers/IController';
import { QueueItemController } from '../../../../interfaces/http/controllers/queue-item.controller';
import { QueueItemServiceFactory } from './queue-item.service.factory';
import { QueueServiceFactory } from '../queue/queue.service.factory';

export class QueueItemControllerFactory {
  static create(): IController {
    return new QueueItemController(
      QueueItemServiceFactory.create(),
      QueueServiceFactory.create(),
    );
  }
}
