import { AppointmentService } from '../../../../domain/appointment/service/appointment.service';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';
import { QueueRepository } from '../../../repository/queue/queue.repository';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';

export class AppointmentServiceFactory {
  static create() {
    const repo = new AppointmentRepository();
    const queueRepo = new QueueRepository();
    const queueItemRepo = new QueueItemRepository();

    return new AppointmentService({
      appointmentRepository: repo,
      queueRepository: queueRepo,
      queueItemRepository: queueItemRepo,
    });
  }
}
