import { RatingService } from '../../../../domain/rating/service/rating.service';
import { RatingRepository } from '../../../repository/rating/rating.repository';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';

export class RatingServiceFactory {
  static create() {
    const ratingRepository = new RatingRepository();
    const appointmentRepository = new AppointmentRepository();

    return new RatingService({
      ratingRepository,
      appointmentRepository,
    });
  }
}
