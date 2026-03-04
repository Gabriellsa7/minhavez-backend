import { IPatient } from '../interfaces/patients.interface';

export interface IParamsCreatePatient {
  userId: string;
  cpf: string;
  birthDate: string;
  phone: string;
  priority: string;
}

export interface IParamsUpdatePatient {
  patientData: Partial<IPatient>;
}

export interface IPatientRepository {
  createPatient(patientData: IParamsCreatePatient): Promise<IPatient>;
  updatePatientById(
    id: string,
    params: IParamsUpdatePatient,
  ): Promise<IPatient | null>;
  deletePatientById(id: string): Promise<IPatient | null>;
  findPatientByUserId(userId: string): Promise<IPatient | null>;
  findPatientById(id: string): Promise<IPatient | null>;
  listPatients(filter: Partial<IPatient>): Promise<IPatient[]>;
}
