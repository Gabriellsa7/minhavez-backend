import { ReceptionistController } from '../../../../interfaces/http/controllers/receptionist.controller';
import { ReceptionistServiceFactory } from './receptionist.service.factory';

export class ReceptionistControllerFactory {
  static create() {
    return new ReceptionistController(ReceptionistServiceFactory.create());
  }
}
