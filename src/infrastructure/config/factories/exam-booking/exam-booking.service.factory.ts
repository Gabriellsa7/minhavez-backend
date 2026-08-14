import { ExamBookingService } from '../../../../domain/exam-booking/service/exam-booking.service';
import { ExamBookingRepository } from '../../../repository/exam-booking/exam-booking.repository';
import { ExamOfferingRepository } from '../../../repository/exam-offering/exam-offering.repository';
import { ExamAvailabilityRepository } from '../../../repository/exam-availability/exam-availability.repository';
import { PatientRepository } from '../../../repository/patient/patient.repository';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';
import { ExamRepository } from '../../../repository/exam/exam.repository';
import { UserRepository } from '../../../repository/user/user.repository';

export class ExamBookingServiceFactory {
  static create() {
    return new ExamBookingService({
      examBookingRepository: new ExamBookingRepository(),
      examOfferingRepository: new ExamOfferingRepository(),
      examAvailabilityRepository: new ExamAvailabilityRepository(),
      patientRepository: new PatientRepository(),
      healthUnitRepository: new HealthUnitRepository(),
      examRepository: new ExamRepository(),
      userRepository: new UserRepository(),
    });
  }
}
