import { IPatient } from '../interfaces/patient.interface';
import {
  IParamsPatientService,
  IPatientService,
} from '../interfaces/patient.service.interface';
import {
  IParamsCreatePatient,
  IParamsUpdatePatient,
  IPatientRepository,
} from '../repository/patient.repository.interface';

export class PatientService implements IPatientService {
  private patientRepository: IPatientRepository;

  constructor(params: IParamsPatientService) {
    this.patientRepository = params.patientRepository;
  }

  async createPatient(params: IParamsCreatePatient): Promise<IPatient> {
    try {
      const existingPatient = await this.patientRepository.findPatientByUserId(
        params.userId,
      );

      if (existingPatient) {
        throw new Error('A patient with this user ID already exists');
      }

      return await this.patientRepository.createPatient(params);
    } catch (error) {
      throw new Error(`Error creating user: ${(error as Error).message}`);
    }
  }

  getPatientById(_id: string): Promise<IPatient | null> {
    try {
      const patient = this.patientRepository.findPatientById(_id);

      if (!patient) {
        throw new Error('Patient not found');
      }

      return patient;
    } catch (error) {
      throw new Error(
        `Error retrieving patient by ID: ${(error as Error).message}`,
      );
    }
  }

  getPatientByUserId(userId: string): Promise<IPatient | null> {
    try {
      const patient = this.patientRepository.findPatientByUserId(userId);

      if (!patient) {
        throw new Error('Patient not found');
      }

      return patient;
    } catch (error) {
      throw new Error(
        `Error retrieving patient by user ID: ${(error as Error).message}`,
      );
    }
  }
  updatePatientById(
    _id: string,
    params: IParamsUpdatePatient,
  ): Promise<IPatient | null> {
    try {
      const patient = this.patientRepository.updatePatientById(_id, params);

      if (!patient) {
        throw new Error('Patient not found');
      }

      return patient;
    } catch (error) {
      throw new Error(
        `Error updating patient by ID: ${(error as Error).message}`,
      );
    }
  }
  deletePatientById(_id: string): Promise<IPatient | null> {
    try {
      const patient = this.patientRepository.deletePatientById(_id);

      if (!patient) {
        throw new Error('Patient not found');
      }

      return patient;
    } catch (error) {
      throw new Error(
        `Error deleting patient by ID: ${(error as Error).message}`,
      );
    }
  }

  listPatients(filter: Partial<IPatient>): Promise<IPatient[]> {
    try {
      return this.patientRepository.listPatients(filter);
    } catch (error) {
      throw new Error(`Error listing patients: ${(error as Error).message}`);
    }
  }
}
