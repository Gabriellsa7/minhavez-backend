import { AppointmentService } from '../../../../domain/appointment/service/appointment.service';
import { AppointmentReminderService } from '../../../../domain/notification/service/appointment-reminder.service';
import { QueueNotificationService } from '../../../../domain/notification/service/queue-notification.service';
import { NotificationService } from '../../../../domain/notification/service/notification.service';
import { AppointmentRepository } from '../../../repository/appointment/appointment.repository';
import { QueueRepository } from '../../../repository/queue/queue.repository';
import { QueueItemRepository } from '../../../repository/queue-item/queue-item.repository';
import { HealthProfessionalRepository } from '../../../repository/health-professional/health-professional.repository';
import { PatientRepository } from '../../../repository/patient/patient.repository';
import { NotificationRepository } from '../../../repository/notification/notification.repository';
import { NotificationJobScheduler } from '../../../queue/bullmq/notification-job-scheduler';
import { NotificationSocketGateway } from '../../../socket/notification.socket';

export class AppointmentServiceFactory {
  static create() {
    const repo = new AppointmentRepository();
    const queueRepo = new QueueRepository();
    const queueItemRepo = new QueueItemRepository();
    const professionalRepo = new HealthProfessionalRepository();
    const patientRepo = new PatientRepository();
    const notificationRepository = new NotificationRepository();
    const notificationJobScheduler = new NotificationJobScheduler();
    const notificationService = new NotificationService({
      notificationRepository,
      notificationJobScheduler,
      notificationSocketGateway: NotificationSocketGateway.getInstance(),
    });
    const appointmentReminderService = new AppointmentReminderService({
      notificationService,
    });
    const queueNotificationService = new QueueNotificationService({
      notificationService,
      queueRepository: queueRepo,
    });

    return new AppointmentService({
      appointmentRepository: repo,
      queueRepository: queueRepo,
      queueItemRepository: queueItemRepo,
      professionalRepository: professionalRepo,
      patientRepository: patientRepo,
      appointmentReminderService,
      queueNotificationService,
      notificationJobScheduler,
    });
  }
}
