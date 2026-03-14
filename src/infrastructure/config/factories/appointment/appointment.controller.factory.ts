import { IController } from '../../../../interfaces/http/controllers/IController';
import { AppointmentController } from '../../../../interfaces/http/controllers/appointment.controller';
import { AppointmentServiceFactory } from './appointment.service.factory';

export class AppointmentControllerFactory {
  static create(): IController {
    return new AppointmentController(AppointmentServiceFactory.create());
  }
}
