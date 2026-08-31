import { IExamOfferingRepository } from '../../exam-offering/repository/exam-offering.repository.interface';
import { IPatientRepository } from '../../patient/repository/patient.repository.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import { IPrescriptionRepository } from '../repository/prescription.repository.interface';
import { IPrescription, IPrescriptionWithContext } from './prescription.interface';

export interface IParamsPrescriptionService {
  prescriptionRepository: IPrescriptionRepository;
  examOfferingRepository: IExamOfferingRepository;
  patientRepository: IPatientRepository;
  userRepository: IUserRepository;
}

export interface IPrescriptionRequester {
  sub: string;
  isAdmin: boolean;
  healthUnitId?: string;
}

export interface IParamsCreatePrescriptionExam {
  examOfferingId: string;
}

export interface IParamsCreatePrescription {
  patientId: string;
  queueItemId?: string;
  medications?: string;
  observations?: string;
  exams: IParamsCreatePrescriptionExam[];
  /** Only honored when the requester is an admin acting on behalf of a professional. */
  professionalId?: string;
  /** Only honored when the requester is an admin acting on behalf of a professional. */
  healthUnitId?: string;
}

export interface IPrescriptionService {
  createPrescription(
    params: IParamsCreatePrescription,
    requester: IPrescriptionRequester,
  ): Promise<IPrescriptionWithContext>;
  getPrescriptionById(id: string): Promise<IPrescriptionWithContext>;
  listPrescriptionsByPatientId(
    patientId: string,
  ): Promise<IPrescriptionWithContext[]>;
  listPrescriptionsByProfessionalId(
    professionalId: string,
    requester: IPrescriptionRequester,
  ): Promise<IPrescriptionWithContext[]>;
}
