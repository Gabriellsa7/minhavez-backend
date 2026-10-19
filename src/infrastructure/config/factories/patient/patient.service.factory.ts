import { PatientService } from '../../../../domain/patient/service/patient.service';
import { PatientRepository } from '../../../repository/patient/patient.repository';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';
import { QueueOrderingServiceFactory } from '../queue-item/queue-ordering.service.factory';

export class PatientServiceFactory {
  static create() {
    const repoRead = new PatientRepository();

    return new PatientService({
      patientRepository: repoRead,
      queueItemRepository: new QueueItemRepository(),
      queueOrderingService: QueueOrderingServiceFactory.create(),
    });
  }
}
