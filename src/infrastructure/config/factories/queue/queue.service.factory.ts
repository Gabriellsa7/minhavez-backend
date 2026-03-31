import { QueueService } from '../../../../domain/queue/service/queue.service';
import { QueueRepository } from '../../../repository/queue/queue.repository';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';

export class QueueServiceFactory {
  static create() {
    const queueRepo = new QueueRepository();
    const queueItemRepo = new QueueItemRepository();
    const healthUnitRepo = new HealthUnitRepository();

    return new QueueService({
      queueRepository: queueRepo,
      queueItemRepository: queueItemRepo,
      healthUnitRepository: healthUnitRepo,
    });
  }
}
