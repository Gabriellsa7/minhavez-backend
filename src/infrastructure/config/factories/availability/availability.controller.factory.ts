import { AvailabilityController } from '../../../../interfaces/http/controllers/availability.controller';
import { AvailabilityService } from '../../../../domain/availability/service/availability.service';
import { HealthProfessionalRepository } from '../../../repository/health-professional/health-professional.repository';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';

export class AvailabilityControllerFactory {
  static create(): AvailabilityController {
    const availabilityService = new AvailabilityService({
      healthProfessionalRepository: new HealthProfessionalRepository(),
      healthUnitRepository: new HealthUnitRepository(),
      appointmentRepository: new AppointmentRepository(),
    });

    return new AvailabilityController(availabilityService);
  }
}
