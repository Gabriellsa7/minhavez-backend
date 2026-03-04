import {
  IParamsCreatePatient,
  IParamsUpdatePatient,
  IPatientRepository,
} from '../repository/patient.repository.interface';
import { IPatient } from './patient.interface';

export interface IParamsPatientService {
  patientRepository: IPatientRepository;
}

export interface IPatientService {
  createPatient(params: IParamsCreatePatient): Promise<IPatient>;
  getPatientById(_id: string): Promise<IPatient | null>;
  getPatientByUserId(userId: string): Promise<IPatient | null>;
  updatePatientById(
    _id: string,
    params: IParamsUpdatePatient,
  ): Promise<IPatient | null>;
  deletePatientById(_id: string): Promise<IPatient | null>;
  listPatients(filter: Partial<IPatient>): Promise<IPatient[]>;
}
