import { ExamService } from '../../../../domain/exam/service/exam.service';
import { ExamRepository } from '../../../repository/exam/exam.repository';
import { PatientRepository } from '../../../repository/patient/patient.repository';
import { HealthUnitRepository } from '../../../repository/health-unit/health-unit.repository';
import { UserRepository } from '../../../repository/user/user.repository';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';
import { ExamBookingRepository } from '../../../repository/exam-booking/exam-booking.repository';
import { NodemailerEmailProvider } from '../../../external/nodemailer/nodemailer-email.provider';
import { NotificationService } from '../../../../domain/notification/service/notification.service';
import { NotificationRepository } from '../../../repository/notification/notification.repository';
import { NotificationJobScheduler } from '../../../queue/bullmq/notification-job-scheduler';
import { NotificationSocketGateway } from '../../../socket/notification.socket';

export class ExamServiceFactory {
  static create() {
    const notificationService = new NotificationService({
      notificationRepository: new NotificationRepository(),
      notificationJobScheduler: new NotificationJobScheduler(),
      notificationSocketGateway: NotificationSocketGateway.getInstance(),
    });

    return new ExamService({
      examRepository: new ExamRepository(),
      patientRepository: new PatientRepository(),
      healthUnitRepository: new HealthUnitRepository(),
      userRepository: new UserRepository(),
      appointmentRepository: new AppointmentRepository(),
      examBookingRepository: new ExamBookingRepository(),
      emailProvider: new NodemailerEmailProvider(),
      notificationService,
    });
  }
}
