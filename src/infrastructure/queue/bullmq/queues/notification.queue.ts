import { BullMqProvider } from '../bullmq.provider';
import { notificationQueueConfig } from '../../../config/notification.constants';

export class NotificationQueue {
  static create() {
    const provider = new BullMqProvider();
    return provider.createQueue(
      notificationQueueConfig.queueNames.notification,
    );
  }
}
