import { IController } from '../../../../interfaces/http/controllers/IController';
import { NotificationController } from '../../../../interfaces/http/controllers/notification.controller';
import { NotificationServiceFactory } from './notification.service.factory';

export class NotificationControllerFactory {
  static create(): IController {
    return new NotificationController(NotificationServiceFactory.create());
  }
}
