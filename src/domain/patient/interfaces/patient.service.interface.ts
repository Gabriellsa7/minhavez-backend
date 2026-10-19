import {
  IParamsCreatePatient,
  IParamsUpdatePatient,
  IPatientRepository,
} from '../repository/patient.repository.interface';
import { IPatient } from './patient.interface';
import { IQueueItemRepository } from '../../queue-item/repository/queue-item.repository.interface';
import { QueueOrderingService } from '../../queue-item/service/queue-ordering.service';

export interface IParamsPatientService {
  patientRepository: IPatientRepository;
  queueItemRepository?: Pick<
    IQueueItemRepository,
    'getQueueItemsByPatientId' | 'updateQueueItemById'
  >;
  queueOrderingService?: Pick<QueueOrderingService, 'recalculatePositions'>;
}

export interface IParamsUploadMedicalDocument {
  fileBase64: string;
  fileName: string;
  mimeType: string;
}

export interface IPatientService {
  createPatient(params: IParamsCreatePatient): Promise<IPatient>;
  getPatientById(_id: string): Promise<IPatient | null>;
  getPatientByUserId(userId: string): Promise<IPatient | null>;
  getPatientByCpf(cpf: string): Promise<IPatient | null>;
  updatePatientById(
    _id: string,
    params: IParamsUpdatePatient,
  ): Promise<IPatient | null>;
  deletePatientById(_id: string): Promise<IPatient | null>;
  listPatients(filter: Partial<IPatient>): Promise<IPatient[]>;
  uploadMedicalDocument(
    patientId: string,
    requesterId: string,
    params: IParamsUploadMedicalDocument,
  ): Promise<IPatient>;
  removeMedicalDocument(
    patientId: string,
    requesterId: string,
    documentId: string,
  ): Promise<IPatient>;
  getMedicalDocumentDownloadUrl(
    patientId: string,
    requesterId: string,
    documentId: string,
  ): Promise<{ fileUrl: string; fileName: string }>;
}
