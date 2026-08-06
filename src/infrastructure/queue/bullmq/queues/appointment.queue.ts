import { BullMqProvider } from '../bullmq.provider';
import { notificationQueueConfig } from '../../../config/notification.constants';

export class AppointmentQueue {
  static create() {
    const provider = new BullMqProvider();
    return provider.createQueue(notificationQueueConfig.queueNames.appointment);
  }
}
