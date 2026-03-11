import { QueueService } from '../../../../domain/queue/service/queue.service';
import { QueueRepository } from '../../../repository/queue/queue.repository';

export class QueueServiceFactory {
  static create() {
    const repoRead = new QueueRepository();

    return new QueueService({
      queueRepository: repoRead,
    });
  }
}
