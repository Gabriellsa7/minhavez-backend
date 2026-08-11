import {
  EAppointmentStatus,
  IAppointment,
} from '../interfaces/appointment.interface';
import { EQueueStatus } from '../../queue/interfaces/queue.interface';
import {
  EQueueItemPriority,
  EQueueItemStatus,
} from '../../queue-item/interfaces/queue-item.interface';
import {
  IParamsCreateAppointment,
  IParamsUpdateAppointment,
  IAppointmentRepository,
} from '../repository/appointment.repository.interface';
import { IQueueRepository } from '../../queue/repository/queue.repository.interface';
import { IQueueItemRepository } from '../../queue-item/repository/queue-item.repository.interface';
import {
  IAppointmentService,
  IParamsAppointmentService,
} from '../interfaces/appointment.service.interface';
import { getQueueShift } from '../../../shared/utils/getQueueShift';
import { IHealthProfessionalRepository } from '../../health-professional.ts/repository/health-professional.repository.interface';
import { AppointmentReminderService } from '../../notification/service/appointment-reminder.service';
import { QueueNotificationService } from '../../notification/service/queue-notification.service';
import { INotificationJobScheduler } from '../../notification/interfaces/notification-job-scheduler.interface';
import { IPatientRepository } from '../../patient/repository/patient.repository.interface';
import { EPatientPriority } from '../../patient/interfaces/patient.interface';

export class AppointmentService implements IAppointmentService {
  private appointmentRepository: IAppointmentRepository;
  private queueRepository: IQueueRepository;
  private queueItemRepository: IQueueItemRepository;
  private healthProfessionalRepository: IHealthProfessionalRepository;
  private appointmentReminderService?: AppointmentReminderService;
  private queueNotificationService?: QueueNotificationService;
  private notificationJobScheduler?: INotificationJobScheduler;
  private patientRepository?: IPatientRepository;

  constructor(
    params: IParamsAppointmentService & {
      appointmentReminderService?: AppointmentReminderService;
      queueNotificationService?: QueueNotificationService;
      notificationJobScheduler?: INotificationJobScheduler;
      patientRepository?: IPatientRepository;
    },
  ) {
    this.appointmentRepository = params.appointmentRepository;
    this.queueRepository = params.queueRepository;
    this.queueItemRepository = params.queueItemRepository;
    this.healthProfessionalRepository = params.professionalRepository;
    this.appointmentReminderService = params.appointmentReminderService;
    this.queueNotificationService = params.queueNotificationService;
    this.notificationJobScheduler = params.notificationJobScheduler;
    this.patientRepository = params.patientRepository;
  }

  async createAppointment(
    params: IParamsCreateAppointment,
  ): Promise<IAppointment> {
    let createdQueueId: string | null = null;
    let createdQueueItemId: string | null = null;

    try {
      if (params.queueItemId) {
        const existingAppointmentWithQueueItemId =
          await this.appointmentRepository.listAppointments({
            queueItemId: params.queueItemId,
          });

        if (existingAppointmentWithQueueItemId.length > 0) {
          throw new Error('Already exist an appointment with de queueItemId');
        }
      }
      const appointmentDateTime = new Date(params.dateTime);

      const existingAppointmentAtSameTime =
        await this.appointmentRepository.listAppointments({
          professionalId: params.professionalId,
        });

      const professional =
        await this.healthProfessionalRepository.getHealthProfessionalById(
          params.professionalId,
        );

      if (!professional) {
        throw new Error('Health professional not found');
      }

      const duration = professional.schedule.appointmentDuration;

      const durationMs = duration * 60 * 1000;

      const hasConflict = existingAppointmentAtSameTime.some((apt) => {
        if (
          apt.status === EAppointmentStatus.COMPLETED ||
          apt.status === EAppointmentStatus.CANCELED
        ) {
          return false;
        }

        const existingStart = new Date(apt.dateTime).getTime();
        const existingEnd = existingStart + durationMs;

        const newStart = appointmentDateTime.getTime();
        const newEnd = newStart + durationMs;

        return newStart < existingEnd && newEnd > existingStart;
      });

      if (hasConflict) {
        throw new Error(
          'This professional already has an appointment at this time',
        );
      }

      const queues = await this.queueRepository.listQueues({
        professionalId: params.professionalId,
        healthUnitId: params.healthUnitId,
      });

      const queueShift = getQueueShift(appointmentDateTime);

      const existingQueue = queues.find(
        (queue) =>
          queue.queueDate.getFullYear() === appointmentDateTime.getFullYear() &&
          queue.queueDate.getMonth() === appointmentDateTime.getMonth() &&
          queue.queueDate.getDate() === appointmentDateTime.getDate() &&
          queue.shift === queueShift,
      );

      let queue = existingQueue;

      if (!queue) {
        queue = await this.queueRepository.createQueue({
          professionalId: params.professionalId,
          healthUnitId: params.healthUnitId,
          status: EQueueStatus.CLOSED,
          queueDate: appointmentDateTime,
          shift: queueShift,
        });
        createdQueueId = queue._id;
      }

      const queueItems = await this.queueItemRepository.listQueueItems({
        queueId: queue._id,
      });

      const existingQueueItem = queueItems.find(
        (queueItem) =>
          queueItem.patientId === params.patientId &&
          queueItem.status !== EQueueItemStatus.FINISHED,
      );

      let queueItem = existingQueueItem;

      if (!queueItem) {
        const patient = await this.patientRepository?.getPatientById(
          params.patientId,
        );
        const priority =
          patient && patient.priority !== EPatientPriority.NORMAL
            ? EQueueItemPriority.HIGH
            : EQueueItemPriority.MEDIUM;

        queueItem = await this.queueItemRepository.createQueueItem({
          queueId: queue._id,
          patientId: params.patientId,
          position: queueItems.length + 1,
          priority,
          status: EQueueItemStatus.WAITING,
        });
        createdQueueItemId = queueItem._id;

        // A patient who joins straight onto one of the notification
        // thresholds (e.g. the 10th person in an empty queue) must still be
        // notified — otherwise their position only ever changes by later
        // recalculations and that first threshold crossing is never observed.
        await this.queueNotificationService?.handleQueuePositionChange(
          queueItem,
        );
      }

      const appointment = await this.appointmentRepository.createAppointment({
        ...params,
        queueItemId: queueItem._id,
      });

      if (this.appointmentReminderService) {
        await this.appointmentReminderService.createReminders(appointment);
      }

      if (params.originQueueItemId) {
        await this.markOriginAppointmentReturnScheduled(
          params.originQueueItemId,
        );
      }

      return appointment;
    } catch (error) {
      await this.rollbackOrphanedQueueState(createdQueueItemId, createdQueueId);

      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        `Error creating appointment: ${(error as Error).message}`,
      );
    }
  }

  /** Best-effort: the return appointment is already created either way — a
   * failure here should only mean the "Concluir" guard stays active, not
   * that the whole booking fails and gets rolled back. */
  private async markOriginAppointmentReturnScheduled(
    originQueueItemId: string,
  ): Promise<void> {
    try {
      const originAppointments = await this.appointmentRepository.listAppointments({
        queueItemId: originQueueItemId,
      });

      const originAppointment = originAppointments[0];
      if (!originAppointment) return;

      await this.appointmentRepository.updateAppointmentById(
        originAppointment._id,
        { returnScheduled: true },
      );
    } catch (error) {
      console.error(
        'Error marking origin appointment as return scheduled:',
        error,
      );
    }
  }

  private async rollbackOrphanedQueueState(
    queueItemId: string | null,
    queueId: string | null,
  ): Promise<void> {
    try {
      if (queueItemId) {
        await this.queueItemRepository.deleteQueueItemById(queueItemId);
      }
      if (queueId) {
        await this.queueRepository.deleteQueueById(queueId);
      }
    } catch (cleanupError) {
      // Best-effort cleanup — the original error is what matters to the caller.
      console.error(
        'Error rolling back orphaned queue state:',
        cleanupError,
      );
    }
  }

  async getAppointmentById(id: string): Promise<IAppointment | null> {
    try {
      const appointment =
        await this.appointmentRepository.getAppointmentById(id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }
      return appointment;
    } catch (error) {
      throw new Error(
        `Error retrieving appointment by ID: ${(error as Error).message}`,
      );
    }
  }

  async listAppointments(
    filter: Partial<IAppointment>,
  ): Promise<IAppointment[]> {
    try {
      return await this.appointmentRepository.listAppointments(filter);
    } catch (error) {
      throw new Error(
        `Error listing appointments: ${(error as Error).message}`,
      );
    }
  }

  async listAppointmentsByPatientId(
    patientId: string,
  ): Promise<IAppointment[]> {
    try {
      return await this.appointmentRepository.listAppointmentsByPatientId(
        patientId,
      );
    } catch (error) {
      throw new Error(
        `Error listing appointments by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async listAppointmentsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IAppointment[]> {
    try {
      return await this.appointmentRepository.listAppointmentsByHealthUnitId(
        healthUnitId,
      );
    } catch (error) {
      throw new Error(
        `Error listing appointments by health unit ID: ${(error as Error).message}`,
      );
    }
  }

  async listAppointmentsByProfessionalId(
    professionalId: string,
  ): Promise<IAppointment[]> {
    try {
      return await this.appointmentRepository.listAppointmentsByProfessionalId(
        professionalId,
      );
    } catch (error) {
      throw new Error(
        `Error listing appointments by professional ID: ${(error as Error).message}`,
      );
    }
  }

  async updateAppointmentById(
    id: string,
    params: IParamsUpdateAppointment,
  ): Promise<IAppointment | null> {
    try {
      const updated = await this.appointmentRepository.updateAppointmentById(
        id,
        params,
      );

      if (
        updated &&
        (params.status === EAppointmentStatus.CANCELED || params.dateTime)
      ) {
        await this.notificationJobScheduler?.cancelJobsForAppointment(id);
      }
      if (!updated) {
        throw new Error('Appointment not found');
      }
      return updated;
    } catch (error) {
      throw new Error(
        `Error updating appointment: ${(error as Error).message}`,
      );
    }
  }

  async deleteAppointmentById(id: string): Promise<IAppointment | null> {
    try {
      const deleted =
        await this.appointmentRepository.deleteAppointmentById(id);

      if (deleted) {
        await this.notificationJobScheduler?.cancelJobsForAppointment(id);
      }
      if (!deleted) {
        throw new Error('Appointment not found');
      }
      return deleted;
    } catch (error) {
      throw new Error(
        `Error deleting appointment: ${(error as Error).message}`,
      );
    }
  }

  async clearAppointmentHistoryByPatientId(
    patientId: string,
  ): Promise<IAppointment[]> {
    try {
      const deleted =
        await this.appointmentRepository.deleteAppointmentsHistoryByPatientId(
          patientId,
        );

      await Promise.all(
        deleted.map((appointment) =>
          this.notificationJobScheduler?.cancelJobsForAppointment(
            appointment._id,
          ),
        ),
      );

      return deleted;
    } catch (error) {
      throw new Error(
        `Error clearing appointment history: ${(error as Error).message}`,
      );
    }
  }
}
