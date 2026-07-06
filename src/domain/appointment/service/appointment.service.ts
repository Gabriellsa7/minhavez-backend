import { IAppointment } from '../interfaces/appointment.interface';
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

export class AppointmentService implements IAppointmentService {
  private appointmentRepository: IAppointmentRepository;
  private queueRepository: IQueueRepository;
  private queueItemRepository: IQueueItemRepository;

  constructor(params: IParamsAppointmentService) {
    this.appointmentRepository = params.appointmentRepository;
    this.queueRepository = params.queueRepository;
    this.queueItemRepository = params.queueItemRepository;
  }

  async createAppointment(
    params: IParamsCreateAppointment,
  ): Promise<IAppointment> {
    try {
      console.log('[AppointmentService] createAppointment params:', JSON.stringify(params, null, 2));

      if (params.queueItemId) {
        console.log('[AppointmentService] Checking for existing appointments with queueItemId:', params.queueItemId);
        const existingAppointmentWithQueueItemId =
          await this.appointmentRepository.listAppointments({
            queueItemId: params.queueItemId,
          });

        if (existingAppointmentWithQueueItemId.length > 0) {
          throw new Error('Already exist an appointment with de queueItemId');
        }
      }

      // Check for conflicts at the same time for the professional
      // Use a time range query instead of exact match to account for timing variations
      const appointmentDateTime = new Date(params.dateTime);
      console.log('[AppointmentService] appointmentDateTime:', appointmentDateTime, 'UTC:', appointmentDateTime.toISOString());
      
      const existingAppointmentAtSameTime =
        await this.appointmentRepository.listAppointments({
          professionalId: params.professionalId,
        });

      console.log('[AppointmentService] Found', existingAppointmentAtSameTime.length, 'existing appointments for professional', params.professionalId);

      const hasConflict = existingAppointmentAtSameTime.some((apt) => {
        const aptTime = new Date(apt.dateTime);
        const sameYear = aptTime.getFullYear() === appointmentDateTime.getFullYear();
        const sameMonth = aptTime.getMonth() === appointmentDateTime.getMonth();
        const sameDate = aptTime.getDate() === appointmentDateTime.getDate();
        const sameHour = aptTime.getHours() === appointmentDateTime.getHours();
        const isActiveAppointment =
          apt.status !== 'COMPLETED' && apt.status !== 'CANCELED';

        const hasConflictFlag =
          isActiveAppointment && sameYear && sameMonth && sameDate && sameHour;

        console.log('[AppointmentService] Comparing appointment times:');
        console.log('  Existing:', aptTime.toISOString(), '- Status:', apt.status, '- Year:', sameYear, 'Month:', sameMonth, 'Date:', sameDate, 'Hour:', sameHour, 'Conflict:', hasConflictFlag);

        return hasConflictFlag;
      });

      if (hasConflict) {
        throw new Error('This professional already has an appointment at this time');
      }

      const openQueues = await this.queueRepository.listQueues({
        professionalId: params.professionalId,
        healthUnitId: params.healthUnitId,
        status: EQueueStatus.OPEN,
      });

      const queue =
        openQueues[0] ??
        (await this.queueRepository.createQueue({
          professionalId: params.professionalId,
          healthUnitId: params.healthUnitId,
          status: EQueueStatus.OPEN,
        }));

      const queueItems = await this.queueItemRepository.listQueueItems({
        queueId: queue._id,
      });

      const existingQueueItem = queueItems.find(
        (queueItem) =>
          queueItem.patientId === params.patientId &&
          queueItem.status !== EQueueItemStatus.FINISHED,
      );

      const queueItem =
        existingQueueItem ??
        (await this.queueItemRepository.createQueueItem({
          queueId: queue._id,
          patientId: params.patientId,
          position: queueItems.length + 1,
          priority: EQueueItemPriority.MEDIUM,
          status: EQueueItemStatus.WAITING,
        }));

      console.log('[AppointmentService] No conflicts found. Creating appointment with params:', params);
      return await this.appointmentRepository.createAppointment({
        ...params,
        queueItemId: queueItem._id,
      });
    } catch (error) {
      console.error('[AppointmentService] Error creating appointment:', error);
      // If it's an Error thrown intentionally (business validation), rethrow it
      if (error instanceof Error) {
        throw error;
      }
      // For non-Error exceptions, wrap to preserve context
      throw new Error(
        `Error creating appointment: ${(error as Error).message}`,
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
}
