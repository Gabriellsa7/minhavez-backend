import { IController } from '../../../../interfaces/http/controllers/IController';
import { ExamAvailabilityController } from '../../../../interfaces/http/controllers/exam-availability.controller';
import { ExamAvailabilityServiceFactory } from './exam-availability.service.factory';

export class ExamAvailabilityControllerFactory {
  static create(): IController {
    return new ExamAvailabilityController(
      ExamAvailabilityServiceFactory.create(),
    );
  }
}
