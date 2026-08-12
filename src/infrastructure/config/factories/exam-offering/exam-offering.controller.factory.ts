import { IController } from '../../../../interfaces/http/controllers/IController';
import { ExamOfferingController } from '../../../../interfaces/http/controllers/exam-offering.controller';
import { ExamOfferingServiceFactory } from './exam-offering.service.factory';

export class ExamOfferingControllerFactory {
  static create(): IController {
    return new ExamOfferingController(ExamOfferingServiceFactory.create());
  }
}
