import { PatientController } from '../../../../interfaces/http/controllers/patient.controller';
import { PatientServiceFactory } from './patient.service.factory';

export class PatientControllerFactory {
  static create() {
    return new PatientController(PatientServiceFactory.create());
  }
}
