import { QueueItemService } from '../../../../domain/queue-item/service/queue-item.service';
import { NotificationService } from '../../../../domain/notification/service/notification.service';
import { QueueNotificationService } from '../../../../domain/notification/service/queue-notification.service';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';
import { QueueRepository } from '../../../repository/queue/queue.repository';
import { NotificationRepository } from '../../../repository/notification/notification.repository';
import { NotificationJobScheduler } from '../../../queue/bullmq/notification-job-scheduler';

export class QueueItemServiceFactory {
  static create() {
    const queueItemRepository = new QueueItemRepository();
    const queueRepository = new QueueRepository();
    const appointmentRepository = new AppointmentRepository();
    const notificationRepository = new NotificationRepository();
    const notificationService = new NotificationService({
      notificationRepository,
      notificationJobScheduler: new NotificationJobScheduler(),
    });
    const queueNotificationService = new QueueNotificationService({
      notificationService,
    });

    return new QueueItemService({
      queueItemRepository,
      queueRepository,
      appointmentRepository,
      queueNotificationService,
    });
  }
}
