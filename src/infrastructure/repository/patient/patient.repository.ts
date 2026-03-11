import { HydratedDocument } from 'mongoose';
import { IPatientSchema } from '../../db/mongo/schema/patient.schema';
import { IPatient } from '../../../domain/patient/interfaces/patient.interface';
import {
  IParamsCreatePatient,
  IParamsUpdatePatient,
  IPatientRepository,
} from '../../../domain/patient/repository/patient.repository.interface';
import { Muser } from '../../db/mongo/models/patient.model';

export class PatientRepository implements IPatientRepository {
  private mapToDomain(patientDoc: HydratedDocument<IPatientSchema>): IPatient {
    return {
      _id: patientDoc._id.toString(),
      userId: patientDoc.userId.toString(),
      cpf: patientDoc.cpf,
      birthDate: patientDoc.birthDate,
      priority: patientDoc.priority,
      phone: patientDoc.phone,
      createdAt: patientDoc.createdAt,
      updatedAt: patientDoc.updatedAt,
    };
  }

  async createPatient(patientDate: IParamsCreatePatient): Promise<IPatient> {
    try {
      const patientDoc = await Muser.create(patientDate);
      return this.mapToDomain(patientDoc);
    } catch (error) {
      throw new Error(`Error creating patient: ${(error as Error).message}`);
    }
  }

  async updatePatientById(
    _id: string,
    params: IParamsUpdatePatient,
  ): Promise<IPatient | null> {
    try {
      const patientDoc = await Muser.findByIdAndUpdate(_id, params, {
        new: true,
      });

      if (!patientDoc) return null;

      return this.mapToDomain(patientDoc);
    } catch (error) {
      throw new Error(`Error updating patient: ${(error as Error).message}`);
    }
  }

  async deletePatientById(id: string): Promise<IPatient | null> {
    try {
      const patientDoc = await Muser.findByIdAndDelete(id);

      if (!patientDoc) return null;

      return this.mapToDomain(patientDoc);
    } catch (error) {
      throw new Error(`Error deleting patient: ${(error as Error).message}`);
    }
  }

  async getPatientById(id: string): Promise<IPatient | null> {
    try {
      const patientDoc = await Muser.findById(id);

      if (!patientDoc) return null;

      return this.mapToDomain(patientDoc);
    } catch (error) {
      throw new Error(`Error getting patient: ${(error as Error).message}`);
    }
  }

  async getPatientByCpf(cpf: string): Promise<IPatient | null> {
    try {
      const patientDoc = await Muser.findOne({ cpf });

      if (!patientDoc) return null;

      return this.mapToDomain(patientDoc);
    } catch (error) {
      throw new Error(
        `Error getting patient by CPF: ${(error as Error).message}`,
      );
    }
  }

  async getPatientByUserId(userId: string): Promise<IPatient | null> {
    try {
      const patientDoc = await Muser.findOne({ userId });

      if (!patientDoc) return null;

      return this.mapToDomain(patientDoc);
    } catch (error) {
      throw new Error(
        `Error getting patients by user ID: ${(error as Error).message}`,
      );
    }
  }

  async listPatients(filter: Partial<IPatient>): Promise<IPatient[]> {
    try {
      const patientDocs = await Muser.find(filter);
      return patientDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(`Error listing patients: ${(error as Error).message}`);
    }
  }
}
