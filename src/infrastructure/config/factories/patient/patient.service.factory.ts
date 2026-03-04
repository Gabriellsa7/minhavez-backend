import { PatientService } from '../../../../domain/patient/service/patient.service';
import { PatientRepository } from '../../../repository/patient/patient.repository';

export class PatientServiceFactory {
  static create() {
    const repoRead = new PatientRepository();

    return new PatientService({
      patientRepository: repoRead,
    });
  }
}
