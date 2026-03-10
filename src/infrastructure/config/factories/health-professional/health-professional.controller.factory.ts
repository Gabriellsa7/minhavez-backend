import { HealthProfessionalController } from '../../../../interfaces/http/controllers/health-professional.controller';
import { HealthProfessionalServiceFactory } from './health-professional.service.factory';

export class HealthProfessionalControllerFactory {
  static create() {
    return new HealthProfessionalController(
      HealthProfessionalServiceFactory.create(),
    );
  }
}
