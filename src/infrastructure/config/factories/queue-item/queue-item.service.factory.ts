import { QueueItemService } from '../../../../domain/queue-item/service/queue-item.service';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';

export class QueueItemServiceFactory {
  static create() {
    const repo = new QueueItemRepository();

    return new QueueItemService({
      queueItemRepository: repo,
    });
  }
}
