import {
  ALLOWED_PATIENT_DOCUMENT_MIME_TYPES,
  EPatientPriority,
  IPatient,
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
import { AppError } from '../../../shared/errors/AppError';
import {
  generateSignedPatientDocumentUrl,
  uploadPatientDocumentToCloudinary,
} from '../../../infrastructure/external/cloudinary/cloudinary-file-upload';

const ELDERLY_AGE_THRESHOLD = 60;

function isAllowedMimeType(
  mimeType: string,
): mimeType is TPatientDocumentMimeType {
  return (ALLOWED_PATIENT_DOCUMENT_MIME_TYPES as readonly string[]).includes(
    mimeType,
  );
}

export class PatientService implements IPatientService {
  private patientRepository: IPatientRepository;

  constructor(params: IParamsPatientService) {
    this.patientRepository = params.patientRepository;
  }

  private assertOwnsPatient(patient: IPatient, requesterId: string): void {
    if (patient.userId !== requesterId) {
      throw new AppError(403, 'You do not have access to this patient');
    }
  }

  /** Strips Cloudinary storage details from medical documents before a
   * patient is returned to a client — same precedent as exams stripping
   * `filePublicId`. */
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
    try {
      const existingPatient = await this.patientRepository.getPatientByUserId(
        params.userId,
      );

      if (existingPatient) {
        throw new AppError(400, 'A patient with this user ID already exists');
      }

      const isElderly = calculateAge(params.birthDate) > ELDERLY_AGE_THRESHOLD;
      const priority = isElderly ? EPatientPriority.ELDERLY : params.priority;

      const patient = await this.patientRepository.createPatient({
        ...params,
        priority,
      });

      return this.sanitizePatient(patient);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error(`Error creating user: ${(error as Error).message}`);
    }
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

        if (birthDate && calculateAge(birthDate) > ELDERLY_AGE_THRESHOLD) {
          updateParams.priority = EPatientPriority.ELDERLY;
        }
      }

      const patient = await this.patientRepository.updatePatientById(
        _id,
        updateParams,
      );

      if (!patient) {
        throw new Error('Patient not found');
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
        throw new Error('Patient not found');
      }

      return this.sanitizePatient(patient);
    } catch (error) {
      throw new Error(
        `Error deleting patient by ID: ${(error as Error).message}`,
      );
    }
  }

  async listPatients(filter: Partial<IPatient>): Promise<IPatient[]> {
    try {
      const patients = await this.patientRepository.listPatients(filter);
      return patients.map((patient) => this.sanitizePatient(patient));
    } catch (error) {
      throw new Error(`Error listing patients: ${(error as Error).message}`);
    }
  }

  async uploadMedicalDocument(
    patientId: string,
    requesterId: string,
    params: IParamsUploadMedicalDocument,
  ): Promise<IPatient> {
    const { fileBase64, fileName, mimeType } = params;

    if (!fileBase64) {
      throw new AppError(400, 'File is required');
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
      throw new AppError(404, 'Patient not found');
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
      throw new AppError(404, 'Patient not found');
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
      throw new AppError(404, 'Patient not found');
    }

    this.assertOwnsPatient(patient, requesterId);

    const documentExists = patient.medicalDocuments.some(
      (document) => document._id === documentId,
    );

    if (!documentExists) {
      throw new AppError(404, 'Medical document not found');
    }

    const updatedPatient = await this.patientRepository.removeMedicalDocument(
      patientId,
      documentId,
    );

    if (!updatedPatient) {
      throw new AppError(404, 'Patient not found');
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
      throw new AppError(404, 'Patient not found');
    }

    this.assertOwnsPatient(patient, requesterId);

    const document = patient.medicalDocuments.find(
      (doc) => doc._id === documentId,
    );

    if (!document) {
      throw new AppError(404, 'Medical document not found');
    }

    const fileUrl = generateSignedPatientDocumentUrl(
      document.filePublicId,
      document.fileFormat,
    );

    return { fileUrl, fileName: document.fileName };
  }
}
