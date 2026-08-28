import { ReceptionistService } from '../../../../domain/receptionist/service/receptionist.service';
import { ReceptionistRepository } from '../../../repository/receptionist/receptionist.repository';

export class ReceptionistServiceFactory {
  static create() {
    const receptionistRepository = new ReceptionistRepository();

    return new ReceptionistService({ receptionistRepository });
  }
}
