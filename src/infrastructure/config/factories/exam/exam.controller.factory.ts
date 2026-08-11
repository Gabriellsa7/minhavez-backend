import { IController } from '../../../../interfaces/http/controllers/IController';
import { ExamController } from '../../../../interfaces/http/controllers/exam.controller';
import { ExamServiceFactory } from './exam.service.factory';

export class ExamControllerFactory {
  static create(): IController {
    return new ExamController(ExamServiceFactory.create());
  }
}
