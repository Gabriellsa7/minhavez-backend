import { IPrescription, IPrescriptionExam } from '../interfaces/prescription.interface';

export interface IParamsCreatePrescription {
  patientId: string;
  professionalId: string;
  healthUnitId: string;
  queueItemId?: string;
  medications?: string;
  observations?: string;
  exams: IPrescriptionExam[];
}

export interface IPrescriptionRepository {
  create(data: IParamsCreatePrescription): Promise<IPrescription>;
  findById(id: string): Promise<IPrescription | null>;
  findByPatientId(patientId: string): Promise<IPrescription[]>;
  findByProfessionalId(professionalId: string): Promise<IPrescription[]>;
  existsForQueueItemId(queueItemId: string): Promise<boolean>;
}
