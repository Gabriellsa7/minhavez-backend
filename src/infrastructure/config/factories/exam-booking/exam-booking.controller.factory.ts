import { IController } from '../../../../interfaces/http/controllers/IController';
import { ExamBookingController } from '../../../../interfaces/http/controllers/exam-booking.controller';
import { ExamBookingServiceFactory } from './exam-booking.service.factory';

export class ExamBookingControllerFactory {
  static create(): IController {
    return new ExamBookingController(ExamBookingServiceFactory.create());
  }
}
