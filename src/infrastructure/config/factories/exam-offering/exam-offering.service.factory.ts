import { ExamOfferingService } from '../../../../domain/exam-offering/service/exam-offering.service';
import { ExamOfferingRepository } from '../../../repository/exam-offering/exam-offering.repository';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';

export class ExamOfferingServiceFactory {
  static create() {
    return new ExamOfferingService({
      examOfferingRepository: new ExamOfferingRepository(),
      healthUnitRepository: new HealthUnitRepository(),
    });
  }
}
