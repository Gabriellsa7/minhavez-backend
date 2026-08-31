import { PrescriptionService } from '../../../../domain/prescription/service/prescription.service';
import { PrescriptionRepository } from '../../../repository/prescription/prescription.repository';
import { ExamOfferingRepository } from '../../../repository/exam-offering/exam-offering.repository';
import { PatientRepository } from '../../../repository/patient/patient.repository';
import { UserRepository } from '../../../repository/user/user.repository';

export class PrescriptionServiceFactory {
  static create() {
    return new PrescriptionService({
      prescriptionRepository: new PrescriptionRepository(),
      examOfferingRepository: new ExamOfferingRepository(),
      patientRepository: new PatientRepository(),
      userRepository: new UserRepository(),
    });
  }
}
