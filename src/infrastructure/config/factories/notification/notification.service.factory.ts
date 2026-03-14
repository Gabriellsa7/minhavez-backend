import { NotificationService } from '../../../../domain/notification/service/notification.service';
import { NotificationRepository } from '../../../repository/notification/notification.repository';

export class NotificationServiceFactory {
  static create() {
    const repo = new NotificationRepository();

    return new NotificationService({
      notificationRepository: repo,
    });
  }
}
