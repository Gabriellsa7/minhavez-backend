import { NotificationService } from '../../../../domain/notification/service/notification.service';
import { NotificationRepository } from '../../../repository/notification/notification.repository';
import { ExpoNotificationProvider } from '../../../external/expo/expo-notification.provider';
import { NotificationJobScheduler } from '../../../queue/bullmq/notification-job-scheduler';
import { NotificationSocketGateway } from '../../../socket/notification.socket';

export class NotificationServiceFactory {
  static create() {
    const repo = new NotificationRepository();

    return new NotificationService({
      notificationRepository: repo,
      notificationProvider: new ExpoNotificationProvider(),
      notificationJobScheduler: new NotificationJobScheduler(),
      notificationSocketGateway: new NotificationSocketGateway(),
    });
  }
}
