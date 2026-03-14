import { IAppointment } from '../interfaces/appointment.interface';

export interface IParamsCreateAppointment {
  patientId: string;
  professionalId: string;
  healthUnitId: string;
  dateTime: string;
  notes?: string;
}

export interface IParamsUpdateAppointment {
  appointmentData: Partial<IAppointment>;
}

export interface IAppointmentRepository {
  createAppointment(
    appointmentData: IParamsCreateAppointment,
  ): Promise<IAppointment>;
  updateAppointmentById(
    id: string,
    params: IParamsUpdateAppointment,
  ): Promise<IAppointment | null>;
  deleteAppointmentById(id: string): Promise<IAppointment | null>;
  getAppointmentById(id: string): Promise<IAppointment | null>;
  listAppointments(filter: Partial<IAppointment>): Promise<IAppointment[]>;
  listAppointmentsByPatientId(patientId: string): Promise<IAppointment[]>;
  listAppointmentsByHealthUnitId(healthUnitId: string): Promise<IAppointment[]>;
  listAppointmentsByProfessionalId(
    professionalId: string,
  ): Promise<IAppointment[]>;
}
