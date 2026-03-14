import { IAppointment } from '../interfaces/appointment.interface';
import {
  IParamsCreateAppointment,
  IParamsUpdateAppointment,
  IAppointmentRepository,
} from '../repository/appointment.repository.interface';
import {
  IAppointmentService,
  IParamsAppointmentService,
} from '../interfaces/appointment.service.interface';

export class AppointmentService implements IAppointmentService {
  private appointmentRepository: IAppointmentRepository;

  constructor(params: IParamsAppointmentService) {
    this.appointmentRepository = params.appointmentRepository;
  }

  async createAppointment(
    params: IParamsCreateAppointment,
  ): Promise<IAppointment> {
    try {
      return await this.appointmentRepository.createAppointment(params);
    } catch (error) {
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
