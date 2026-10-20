import {
  ALLOWED_PATIENT_DOCUMENT_MIME_TYPES,
  ELDERLY_MIN_AGE,
  EPatientPriority,
  IPatient,
  isPriorityCategory,
  MAX_PATIENT_DOCUMENT_SIZE_BYTES,
  PATIENT_DOCUMENT_FORMAT_BY_MIME,
  TPatientDocumentMimeType,
} from '../interfaces/patient.interface';
import {
  IParamsPatientService,
  IParamsUploadMedicalDocument,
  IPatientService,
} from '../interfaces/patient.service.interface';
import {
  IParamsCreatePatient,
  IParamsUpdatePatient,
  IPatientRepository,
} from '../repository/patient.repository.interface';
import { calculateAge } from '../../../shared/utils/calculateAge';
import { isValidCpf } from '../../../shared/utils/isValidCpf';
import { AppError } from '../../../shared/errors/AppError';
import {
  EQueueItemPriority,
  EQueueItemStatus,
} from '../../queue-item/interfaces/queue-item.interface';
import {
  generateSignedPatientDocumentUrl,
  uploadPatientDocumentToCloudinary,
} from '../../../infrastructure/external/cloudinary/cloudinary-file-upload';

function isAllowedMimeType(
  mimeType: string,
): mimeType is TPatientDocumentMimeType {
  return (ALLOWED_PATIENT_DOCUMENT_MIME_TYPES as readonly string[]).includes(
    mimeType,
  );
}

export class PatientService implements IPatientService {
  private patientRepository: IPatientRepository;
  private queueItemRepository?: IParamsPatientService['queueItemRepository'];
  private queueOrderingService?: IParamsPatientService['queueOrderingService'];

  constructor(params: IParamsPatientService) {
    this.patientRepository = params.patientRepository;
    this.queueItemRepository = params.queueItemRepository;
    this.queueOrderingService = params.queueOrderingService;
  }

  // The queue item copies the patient's priority when it is created; a later change on the
  // profile must also reach the queues the patient is still waiting in.
  private async syncWaitingQueuePriority(
    patientId: string,
    priority: EPatientPriority,
  ): Promise<void> {
    if (!this.queueItemRepository) return;

    const queuePriority = isPriorityCategory(priority)
      ? EQueueItemPriority.HIGH
      : EQueueItemPriority.MEDIUM;

    const waitingItems = (
      await this.queueItemRepository.getQueueItemsByPatientId(patientId)
    ).filter(
      (item) =>
        item.status === EQueueItemStatus.WAITING &&
        item.priority !== queuePriority,
    );

    for (const item of waitingItems) {
      await this.queueItemRepository.updateQueueItemById(item._id, {
        priority: queuePriority,
      });
      await this.queueOrderingService?.recalculatePositions(item.queueId);
    }
  }

  private assertOwnsPatient(patient: IPatient, requesterId: string): void {
    if (patient.userId !== requesterId) {
      throw new AppError(403, 'Você não tem acesso aos dados deste paciente.');
    }
  }

  private sanitizePatient(patient: IPatient): IPatient {
    return {
      ...patient,
      medicalDocuments: patient.medicalDocuments.map(
        ({ filePublicId: _filePublicId, fileFormat: _fileFormat, ...rest }) =>
          rest,
      ) as IPatient['medicalDocuments'],
    };
  }

  async createPatient(params: IParamsCreatePatient): Promise<IPatient> {
    if (!isValidCpf(params.cpf)) {
      throw new AppError(400, 'CPF inválido.');
    }

    const existingPatient = await this.patientRepository.getPatientByUserId(
      params.userId,
    );

    if (existingPatient) {
      throw new AppError(400, 'Este usuário já tem um cadastro de paciente.');
    }

    const isElderly = calculateAge(params.birthDate) >= ELDERLY_MIN_AGE;
    const priority = isElderly ? EPatientPriority.ELDERLY : params.priority;

    const patient = await this.patientRepository.createPatient({
      ...params,
      priority,
    });

    return this.sanitizePatient(patient);
  }

  async getPatientById(_id: string): Promise<IPatient | null> {
    const patient = await this.patientRepository.getPatientById(_id);
    return patient ? this.sanitizePatient(patient) : null;
  }

  async getPatientByUserId(userId: string): Promise<IPatient | null> {
    const patient = await this.patientRepository.getPatientByUserId(userId);
    return patient ? this.sanitizePatient(patient) : null;
  }

  async getPatientByCpf(cpf: string): Promise<IPatient | null> {
    const patient = await this.patientRepository.getPatientByCpf(cpf);
    return patient ? this.sanitizePatient(patient) : null;
  }

  async updatePatientById(
    _id: string,
    params: IParamsUpdatePatient,
  ): Promise<IPatient | null> {
    try {
      const updateParams = { ...params };

      if (updateParams.priority !== undefined) {
        const birthDate =
          updateParams.birthDate ??
          (await this.patientRepository.getPatientById(_id))?.birthDate;

        if (birthDate && calculateAge(birthDate) >= ELDERLY_MIN_AGE) {
          updateParams.priority = EPatientPriority.ELDERLY;
        }
      }

      const patient = await this.patientRepository.updatePatientById(
        _id,
        updateParams,
      );

      if (!patient) {
        throw new Error('Paciente não encontrado.');
      }

      if (updateParams.priority !== undefined) {
        await this.syncWaitingQueuePriority(_id, patient.priority);
      }

      return this.sanitizePatient(patient);
    } catch (error) {
      throw new Error(
        `Error updating patient by ID: ${(error as Error).message}`,
      );
    }
  }

  async deletePatientById(_id: string): Promise<IPatient | null> {
    try {
      const patient = await this.patientRepository.deletePatientById(_id);

      if (!patient) {
        throw new Error('Paciente não encontrado.');
      }

      return this.sanitizePatient(patient);
    } catch (error) {
      throw new Error(
        `Error deleting patient by ID: ${(error as Error).message}`,
      );
    }
  }

  async listPatients(filter: Partial<IPatient>): Promise<IPatient[]> {
    const patients = await this.patientRepository.listPatients(filter);
    return patients.map((patient) => this.sanitizePatient(patient));
  }

  async uploadMedicalDocument(
    patientId: string,
    requesterId: string,
    params: IParamsUploadMedicalDocument,
  ): Promise<IPatient> {
    const { fileBase64, fileName, mimeType } = params;

    if (!fileBase64) {
      throw new AppError(400, 'Envie o arquivo.');
    }

    if (!isAllowedMimeType(mimeType)) {
      throw new AppError(
        400,
        `Unsupported file type. Allowed types: ${ALLOWED_PATIENT_DOCUMENT_MIME_TYPES.join(', ')}`,
      );
    }

    const cleanBase64 = fileBase64.includes(',')
      ? fileBase64.split(',')[1]
      : fileBase64;
    const approximateFileSize = Math.ceil((cleanBase64.length * 3) / 4);

    if (approximateFileSize > MAX_PATIENT_DOCUMENT_SIZE_BYTES) {
      throw new AppError(
        400,
        `File too large. Maximum size is ${MAX_PATIENT_DOCUMENT_SIZE_BYTES / (1024 * 1024)}MB`,
      );
    }

    const patient = await this.patientRepository.getPatientById(patientId);

    if (!patient) {
      throw new AppError(404, 'Paciente não encontrado.');
    }

    this.assertOwnsPatient(patient, requesterId);

    const format = PATIENT_DOCUMENT_FORMAT_BY_MIME[mimeType];
    const upload = await uploadPatientDocumentToCloudinary({
      fileBase64,
      fileName,
      format,
      mimeType,
    });

    const updatedPatient = await this.patientRepository.addMedicalDocument(
      patientId,
      {
        filePublicId: upload.publicId,
        fileFormat: format,
        fileName,
        mimeType,
        fileSize: upload.fileSize,
        uploadedAt: new Date(),
      },
    );

    if (!updatedPatient) {
      throw new AppError(404, 'Paciente não encontrado.');
    }

    return this.sanitizePatient(updatedPatient);
  }

  async removeMedicalDocument(
    patientId: string,
    requesterId: string,
    documentId: string,
  ): Promise<IPatient> {
    const patient = await this.patientRepository.getPatientById(patientId);

    if (!patient) {
      throw new AppError(404, 'Paciente não encontrado.');
    }

    this.assertOwnsPatient(patient, requesterId);

    const documentExists = patient.medicalDocuments.some(
      (document) => document._id === documentId,
    );

    if (!documentExists) {
      throw new AppError(404, 'Documento médico não encontrado.');
    }

    const updatedPatient = await this.patientRepository.removeMedicalDocument(
      patientId,
      documentId,
    );

    if (!updatedPatient) {
      throw new AppError(404, 'Paciente não encontrado.');
    }

    return this.sanitizePatient(updatedPatient);
  }

  async getMedicalDocumentDownloadUrl(
    patientId: string,
    requesterId: string,
    documentId: string,
  ): Promise<{ fileUrl: string; fileName: string }> {
    const patient = await this.patientRepository.getPatientById(patientId);

    if (!patient) {
      throw new AppError(404, 'Paciente não encontrado.');
    }

    this.assertOwnsPatient(patient, requesterId);

    const document = patient.medicalDocuments.find(
      (doc) => doc._id === documentId,
    );

    if (!document) {
      throw new AppError(404, 'Documento médico não encontrado.');
    }

    const fileUrl = generateSignedPatientDocumentUrl(
      document.filePublicId,
      document.fileFormat,
    );

    return { fileUrl, fileName: document.fileName };
  }
}
