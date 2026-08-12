import { ExamAvailabilityService } from '../../../../domain/exam-availability/service/exam-availability.service';
import { ExamAvailabilityRepository } from '../../../repository/exam-availability/exam-availability.repository';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';

export class ExamAvailabilityServiceFactory {
  static create() {
    return new ExamAvailabilityService({
      examAvailabilityRepository: new ExamAvailabilityRepository(),
      healthUnitRepository: new HealthUnitRepository(),
    });
  }
}
