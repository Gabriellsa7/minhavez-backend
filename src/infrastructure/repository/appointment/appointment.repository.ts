import { HydratedDocument } from 'mongoose';
import { IAppointment } from '../../../domain/appointment/interfaces/appointment.interface';
import { IAppointmentSchema } from '../../db/mongo/schema/appointment.schema';
import {
  IParamsCreateAppointment,
  IParamsUpdateAppointment,
  IAppointmentRepository,
} from '../../../domain/appointment/repository/appointment.repository.interface';
import { Muser } from '../../db/mongo/models/appointment.model';

export class AppointmentRepository implements IAppointmentRepository {
  private mapToDomain(
    appointmentDoc: HydratedDocument<IAppointmentSchema>,
  ): IAppointment {
    return {
      _id: appointmentDoc._id.toString(),
      patientId: appointmentDoc.patientId.toString(),
      professionalId: appointmentDoc.professionalId.toString(),
      healthUnitId: appointmentDoc.healthUnitId.toString(),
      dateTime: appointmentDoc.dateTime,
      status: appointmentDoc.status,
      notes: appointmentDoc.notes,
      checkInAt: appointmentDoc.checkInAt,
      finishedAt: appointmentDoc.finishedAt,
      createdAt: appointmentDoc.createdAt,
      updatedAt: appointmentDoc.updatedAt,
    };
  }

  async createAppointment(
    appointmentData: IParamsCreateAppointment,
  ): Promise<IAppointment> {
    try {
      const appointmentDoc = await Muser.create(appointmentData);
      return this.mapToDomain(appointmentDoc);
    } catch (error) {
      throw new Error(
        `Error creating appointment: ${(error as Error).message}`,
      );
    }
  }

  async updateAppointmentById(
    id: string,
    params: IParamsUpdateAppointment,
  ): Promise<IAppointment | null> {
    try {
      const appointmentDoc = await Muser.findByIdAndUpdate(id, params, {
        new: true,
      });

      if (!appointmentDoc) return null;

      return this.mapToDomain(appointmentDoc);
    } catch (error) {
      throw new Error(
        `Error updating appointment by ID: ${(error as Error).message}`,
      );
    }
  }

  async deleteAppointmentById(id: string): Promise<IAppointment | null> {
    try {
      const appointmentDoc = await Muser.findByIdAndDelete(id);
      if (!appointmentDoc) return null;

      return this.mapToDomain(appointmentDoc);
    } catch (error) {
      throw new Error(
        `Error deleting appointment by ID: ${(error as Error).message}`,
      );
    }
  }

  async getAppointmentById(id: string): Promise<IAppointment | null> {
    try {
      const appointmentDoc = await Muser.findById(id);
      if (!appointmentDoc) return null;

      return this.mapToDomain(appointmentDoc);
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
      const appointmentDocs = await Muser.find(filter);
      return appointmentDocs.map((doc) => this.mapToDomain(doc));
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
      const appointmentDocs = await Muser.find({ patientId });
      return appointmentDocs.map((doc) => this.mapToDomain(doc));
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
      const appointmentDocs = await Muser.find({ healthUnitId });
      return appointmentDocs.map((doc) => this.mapToDomain(doc));
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
      const appointmentDocs = await Muser.find({ professionalId });
      return appointmentDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing appointments by professional ID: ${(error as Error).message}`,
      );
    }
  }
}
