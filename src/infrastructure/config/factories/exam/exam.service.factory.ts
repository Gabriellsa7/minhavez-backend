import { ExamService } from '../../../../domain/exam/service/exam.service';
import { ExamRepository } from '../../../repository/exam/exam.repository';
import { PatientRepository } from '../../../repository/patient/patient.repository';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';
import { UserRepository } from '../../../repository/user/user.repository';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';

export class ExamServiceFactory {
  static create() {
    return new ExamService({
      examRepository: new ExamRepository(),
      patientRepository: new PatientRepository(),
      healthUnitRepository: new HealthUnitRepository(),
      userRepository: new UserRepository(),
      appointmentRepository: new AppointmentRepository(),
    });
  }
}
