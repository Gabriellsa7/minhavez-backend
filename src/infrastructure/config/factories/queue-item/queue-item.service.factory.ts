import { QueueItemService } from '../../../../domain/queue-item/service/queue-item.service';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';
import { QueueRepository } from '../../../repository/queue/queue.repository';

export class QueueItemServiceFactory {
  static create() {
    const queueItemRepository = new QueueItemRepository();
    const queueRepository = new QueueRepository();

    return new QueueItemService({
      queueItemRepository,
      queueRepository,
    });
  }
}
