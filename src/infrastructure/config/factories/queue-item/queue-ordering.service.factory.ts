import { QueueOrderingService } from '../../../../domain/queue-item/service/queue-ordering.service';
import { QueueNotificationService } from '../../../../domain/notification/service/queue-notification.service';
import { NotificationService } from '../../../../domain/notification/service/notification.service';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';
import { QueueRepository } from '../../../repository/queue/queue.repository';
import { NotificationRepository } from '../../../repository/notification/notification.repository';
import { NotificationJobScheduler } from '../../../queue/bullmq/notification-job-scheduler';
import { NotificationSocketGateway } from '../../../socket/notification.socket';

export class QueueOrderingServiceFactory {
  static create(): QueueOrderingService {
    const queueItemRepository = new QueueItemRepository();
    const queueRepository = new QueueRepository();
    const notificationRepository = new NotificationRepository();
    const notificationService = new NotificationService({
      notificationRepository,
      notificationJobScheduler: new NotificationJobScheduler(),
      notificationSocketGateway: NotificationSocketGateway.getInstance(),
    });
    const queueNotificationService = new QueueNotificationService({
      notificationService,
      queueRepository,
    });

    return new QueueOrderingService({
      queueItemRepository,
      queueNotificationService,
      notificationSocketGateway: NotificationSocketGateway.getInstance(),
    });
  }
}
