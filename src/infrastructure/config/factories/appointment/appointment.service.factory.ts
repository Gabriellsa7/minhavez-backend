import { AppointmentService } from '../../../../domain/appointment/service/appointment.service';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';

export class AppointmentServiceFactory {
  static create() {
    const repo = new AppointmentRepository();

    return new AppointmentService({
      appointmentRepository: repo,
    });
  }
}
