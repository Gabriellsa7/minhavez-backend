import {
  IParamsCreateAppointment,
  IParamsUpdateAppointment,
  IAppointmentRepository,
} from '../repository/appointment.repository.interface';
import { IQueueRepository } from '../../queue/repository/queue.repository.interface';
import { IQueueItemRepository } from '../../queue-item/repository/queue-item.repository.interface';
import { IAppointment } from './appointment.interface';

export interface IParamsAppointmentService {
  appointmentRepository: IAppointmentRepository;
  queueRepository: IQueueRepository;
  queueItemRepository: IQueueItemRepository;
}

export interface IAppointmentService {
  createAppointment(params: IParamsCreateAppointment): Promise<IAppointment>;
  getAppointmentById(id: string): Promise<IAppointment | null>;
  listAppointments(filter: Partial<IAppointment>): Promise<IAppointment[]>;
  listAppointmentsByPatientId(patientId: string): Promise<IAppointment[]>;
  listAppointmentsByHealthUnitId(healthUnitId: string): Promise<IAppointment[]>;
  listAppointmentsByProfessionalId(
    professionalId: string,
  ): Promise<IAppointment[]>;
  updateAppointmentById(
    id: string,
    params: IParamsUpdateAppointment,
  ): Promise<IAppointment | null>;
  deleteAppointmentById(id: string): Promise<IAppointment | null>;
}
