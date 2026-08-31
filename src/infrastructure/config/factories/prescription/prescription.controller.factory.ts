import { IController } from '../../../../interfaces/http/controllers/IController';
import { PrescriptionController } from '../../../../interfaces/http/controllers/prescription.controller';
import { PrescriptionServiceFactory } from './prescription.service.factory';

export class PrescriptionControllerFactory {
  static create(): IController {
    return new PrescriptionController(PrescriptionServiceFactory.create());
  }
}
