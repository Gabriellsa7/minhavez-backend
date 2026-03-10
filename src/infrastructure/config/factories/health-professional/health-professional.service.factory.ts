import { HealthProfessionalService } from '../../../../domain/health-professional.ts/service/health-professional.service';
import { HealthProfessionalRepository } from '../../../repository/health-professional/health-professional.repository';

export class HealthProfessionalServiceFactory {
  static create() {
    const repoRead = new HealthProfessionalRepository();

    return new HealthProfessionalService({
      healthProfessionalRepository: repoRead,
    });
  }
}
