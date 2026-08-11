import { IAppointment } from '../interfaces/appointment.interface';

export interface IParamsCreateAppointment {
  patientId: string;
  professionalId: string;
  healthUnitId: string;
  queueItemId?: string | null;
  dateTime: Date;
  notes?: string;
  isReturn?: boolean;
  /** QueueItemId of the appointment currently being attended, when this one is created via "Marcar Retorno". */
  originQueueItemId?: string;
}

export type IParamsUpdateAppointment = Partial<IAppointment>;

export interface IAppointmentRepository {
  createAppointment(
    appointmentData: IParamsCreateAppointment,
  ): Promise<IAppointment>;
  updateAppointmentById(
    id: string,
    params: IParamsUpdateAppointment,
  ): Promise<IAppointment | null>;
  deleteAppointmentById(id: string): Promise<IAppointment | null>;
  deleteAppointmentsHistoryByPatientId(
    patientId: string,
  ): Promise<IAppointment[]>;
  getAppointmentById(id: string): Promise<IAppointment | null>;
  listAppointments(filter: Partial<IAppointment>): Promise<IAppointment[]>;
  listAppointmentsByPatientId(patientId: string): Promise<IAppointment[]>;
  listAppointmentsByHealthUnitId(healthUnitId: string): Promise<IAppointment[]>;
  listAppointmentsByProfessionalId(
    professionalId: string,
  ): Promise<IAppointment[]>;
}
