import { IController } from '../../../../interfaces/http/controllers/IController';
import { QueueItemController } from '../../../../interfaces/http/controllers/queue-item.controller';
import { QueueItemServiceFactory } from './queue-item.service.factory';

export class QueueItemControllerFactory {
  static create(): IController {
    return new QueueItemController(QueueItemServiceFactory.create());
  }
}
