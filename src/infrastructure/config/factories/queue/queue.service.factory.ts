import { QueueService } from '../../../../domain/queue/service/queue.service';
import { QueueRepository } from '../../../repository/queue/queue.repository';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';
import { HealthProfessionalRepository } from '../../../repository/health-professional/health-professional.repository';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';
import { NotificationSocketGateway } from '../../../socket/notification.socket';
import { NotificationServiceFactory } from '../notification/notification.service.factory';

export class QueueServiceFactory {
  static create() {
    const queueRepo = new QueueRepository();
    const queueItemRepo = new QueueItemRepository();
    const healthUnitRepo = new HealthUnitRepository();
    const healthProfessionalRepo = new HealthProfessionalRepository();
    const appointmentRepo = new AppointmentRepository();

    return new QueueService({
      queueRepository: queueRepo,
      queueItemRepository: queueItemRepo,
      healthUnitRepository: healthUnitRepo,
      healthProfessionalRepository: healthProfessionalRepo,
      appointmentRepository: appointmentRepo,
      notificationSocketGateway: NotificationSocketGateway.getInstance(),
      notificationService: NotificationServiceFactory.create(),
    });
  }
}
