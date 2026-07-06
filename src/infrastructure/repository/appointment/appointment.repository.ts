import { HydratedDocument } from 'mongoose';
import { Types, FilterQuery } from 'mongoose';
import { IAppointment } from '../../../domain/appointment/interfaces/appointment.interface';
import { IAppointmentSchema } from '../../db/mongo/schema/appointment.schema';
import {
  IParamsCreateAppointment,
  IParamsUpdateAppointment,
  IAppointmentRepository,
} from '../../../domain/appointment/repository/appointment.repository.interface';
import { MAppointment } from '../../db/mongo/models/appointment.model';

export class AppointmentRepository implements IAppointmentRepository {
  private mapToDomain(
    appointmentDoc: HydratedDocument<IAppointmentSchema>,
  ): IAppointment {
    return {
      _id: appointmentDoc._id.toString(),
      patientId: appointmentDoc.patientId.toString(),
      professionalId: appointmentDoc.professionalId.toString(),
      queueItemId: appointmentDoc.queueItemId?.toString() || null,
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
      console.log('[AppointmentRepository] Creating appointment:', appointmentData);
      
      // Convert string IDs to Mongoose ObjectIds and ensure dateTime is a Date object
      try {
        const appointmentToCreate = {
          patientId: new Types.ObjectId(appointmentData.patientId),
          professionalId: new Types.ObjectId(appointmentData.professionalId),
          healthUnitId: new Types.ObjectId(appointmentData.healthUnitId),
          queueItemId: appointmentData.queueItemId
            ? new Types.ObjectId(appointmentData.queueItemId)
            : undefined,
          dateTime: new Date(appointmentData.dateTime), // Ensure dateTime is a Date object
          notes: appointmentData.notes,
        };

        console.log('[AppointmentRepository] appointmentToCreate:', appointmentToCreate);
        const appointmentDoc = await MAppointment.create(appointmentToCreate);
        console.log('[AppointmentRepository] Appointment created:', appointmentDoc);
        return this.mapToDomain(appointmentDoc);
      } catch (conversionError) {
        console.error('[AppointmentRepository] ID conversion error:', conversionError);
        throw new Error(
          `Invalid ID format: ${(conversionError as Error).message}`,
        );
      }
    } catch (error) {
      console.error('[AppointmentRepository] Error creating appointment:', error);
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
      const appointmentDoc = await MAppointment.findByIdAndUpdate(id, params, {
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
      const appointmentDoc = await MAppointment.findByIdAndDelete(id);
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
      const appointmentDoc = await MAppointment.findById(id);
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
      // Convert string IDs in filter to ObjectIds for proper Mongoose queries
      const mongoFilter: FilterQuery<IAppointmentSchema> = {};
      
      if (filter.patientId) {
        mongoFilter.patientId = new Types.ObjectId(filter.patientId as string);
      }
      if (filter.professionalId) {
        mongoFilter.professionalId = new Types.ObjectId(filter.professionalId as string);
      }
      if (filter.healthUnitId) {
        mongoFilter.healthUnitId = new Types.ObjectId(filter.healthUnitId as string);
      }
      if (filter.queueItemId) {
        mongoFilter.queueItemId = new Types.ObjectId(filter.queueItemId as string);
      }
      
      const appointmentDocs = await MAppointment.find(mongoFilter);
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
      const mongoPatientId = new Types.ObjectId(patientId);
      const appointmentDocs = await MAppointment.find({ patientId: mongoPatientId });
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
      const mongoHealthUnitId = new Types.ObjectId(healthUnitId);
      const appointmentDocs = await MAppointment.find({ healthUnitId: mongoHealthUnitId });
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
      const mongoProfessionalId = new Types.ObjectId(professionalId);
      const appointmentDocs = await MAppointment.find({ professionalId: mongoProfessionalId });
      return appointmentDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing appointments by professional ID: ${(error as Error).message}`,
      );
    }
  }
}
