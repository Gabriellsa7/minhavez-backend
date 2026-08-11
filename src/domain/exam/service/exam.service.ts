import { AppError } from '../../../shared/errors/AppError';
import { normalizeCpf } from '../../../shared/utils/normalizeCpf';
import { IPatient } from '../../patient/interfaces/patient.interface';
import {
  ALLOWED_EXAM_MIME_TYPE,
  IExam,
  IExamWithContext,
  IExamWithFileUrl,
} from '../interfaces/exam.interface';
import {
  IExamService,
  IParamsExamService,
  IParamsRegisterExam,
  IRequestingUser,
} from '../interfaces/exam.service.interface';
import { IExamRepository } from '../repository/exam.repository.interface';
import { IPatientRepository } from '../../patient/repository/patient.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import { IAppointmentRepository } from '../../appointment/repository/appointment.repository.interface';
import {
  generateSignedExamFileUrl,
  uploadPdfToCloudinary,
} from '../../../infrastructure/external/cloudinary/cloudinary-file-upload';

export class ExamService implements IExamService {
  private examRepository: IExamRepository;
  private patientRepository: IPatientRepository;
  private healthUnitRepository: IHealthUnitRepository;
  private userRepository: IUserRepository;
  private appointmentRepository: IAppointmentRepository;

  constructor(params: IParamsExamService) {
    this.examRepository = params.examRepository;
    this.patientRepository = params.patientRepository;
    this.healthUnitRepository = params.healthUnitRepository;
    this.userRepository = params.userRepository;
    this.appointmentRepository = params.appointmentRepository;
  }

  async registerExam(
    params: IParamsRegisterExam,
    requestingAdminUserId: string,
  ): Promise<IExamWithContext> {
    if (params.mimeType !== ALLOWED_EXAM_MIME_TYPE) {
      throw new AppError(400, 'Only PDF files are allowed for exam results');
    }

    if (!params.fileBase64) {
      throw new AppError(400, 'Exam file is required');
    }

    if (!params.examType) {
      throw new AppError(400, 'Exam type is required');
    }

    const patient = await this.patientRepository.getPatientByCpf(
      normalizeCpf(params.patientCpf),
    );

    if (!patient) {
      throw new AppError(400, 'No patient found for the given CPF');
    }

    const healthUnit = await this.healthUnitRepository.getHealthUnitById(
      params.healthUnitId,
    );

    if (!healthUnit) {
      throw new AppError(404, 'Health unit not found');
    }

    if (healthUnit.userId !== requestingAdminUserId) {
      throw new AppError(
        403,
        'You can only register exams for a health unit you own',
      );
    }

    const upload = await uploadPdfToCloudinary({
      fileBase64: params.fileBase64,
      fileName: params.fileName,
    });

    const exam = await this.examRepository.createExam({
      patientId: patient._id,
      healthUnitId: params.healthUnitId,
      uploadedByUserId: requestingAdminUserId,
      examType: params.examType,
      examDate: params.examDate ?? null,
      doctorName: params.doctorName,
      notes: params.notes,
      filePublicId: upload.publicId,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: upload.fileSize,
    });

    return this.enrichExam(exam, patient, healthUnit);
  }

  async getExamForRequester(
    id: string,
    requester: IRequestingUser,
  ): Promise<IExamWithFileUrl> {
    const exam = await this.examRepository.getExamById(id);

    if (!exam) {
      throw new AppError(404, 'Exam not found');
    }

    await this.assertCanAccessExam(exam, requester);

    const enriched = await this.enrichExam(exam);

    return {
      ...enriched,
      fileUrl: generateSignedExamFileUrl(exam.filePublicId),
    };
  }

  async listExamsByPatientId(
    patientId: string,
    requester: IRequestingUser,
  ): Promise<IExamWithContext[]> {
    const patient = await this.patientRepository.getPatientById(patientId);

    if (!patient) {
      throw new AppError(404, 'Patient not found');
    }

    await this.assertCanAccessPatientExams(patient, requester);

    const exams = await this.examRepository.listExamsByPatientId(patientId);

    return Promise.all(exams.map((exam) => this.enrichExam(exam, patient)));
  }

  async listExamsByHealthUnitId(
    healthUnitId: string,
    requester: IRequestingUser,
  ): Promise<IExamWithContext[]> {
    if (!requester.isAdmin) {
      throw new AppError(403, 'Forbidden');
    }

    const healthUnit =
      await this.healthUnitRepository.getHealthUnitById(healthUnitId);

    if (!healthUnit) {
      throw new AppError(404, 'Health unit not found');
    }

    if (healthUnit.userId !== requester.sub) {
      throw new AppError(403, 'Forbidden');
    }

    const exams =
      await this.examRepository.listExamsByHealthUnitId(healthUnitId);

    return Promise.all(exams.map((exam) => this.enrichExam(exam, undefined, healthUnit)));
  }

  async listExamsByProfessionalId(
    professionalId: string,
    requester: IRequestingUser,
  ): Promise<IExamWithContext[]> {
    if (!requester.isHealthProfessional || requester.sub !== professionalId) {
      throw new AppError(403, 'Forbidden');
    }

    const authorizedPatientIds =
      await this.getAuthorizedPatientIdsForProfessional(professionalId);

    if (authorizedPatientIds.length === 0) {
      return [];
    }

    const exams =
      await this.examRepository.listExamsByPatientIds(authorizedPatientIds);

    return Promise.all(exams.map((exam) => this.enrichExam(exam)));
  }

  private async getAuthorizedPatientIdsForProfessional(
    professionalId: string,
  ): Promise<string[]> {
    const appointments =
      await this.appointmentRepository.listAppointmentsByProfessionalId(
        professionalId,
      );

    return [...new Set(appointments.map((appointment) => appointment.patientId))];
  }

  private async assertCanAccessExam(
    exam: IExam,
    requester: IRequestingUser,
  ): Promise<void> {
    if (requester.isAdmin) {
      const healthUnit = await this.healthUnitRepository.getHealthUnitById(
        exam.healthUnitId,
      );
      if (healthUnit?.userId === requester.sub) return;
      throw new AppError(403, 'Forbidden');
    }

    if (requester.isHealthProfessional) {
      const authorizedPatientIds =
        await this.getAuthorizedPatientIdsForProfessional(requester.sub);
      if (authorizedPatientIds.includes(exam.patientId)) return;
      throw new AppError(403, 'Forbidden');
    }

    const patient = await this.patientRepository.getPatientById(
      exam.patientId,
    );
    if (patient?.userId === requester.sub) return;
    throw new AppError(403, 'Forbidden');
  }

  private async assertCanAccessPatientExams(
    patient: IPatient,
    requester: IRequestingUser,
  ): Promise<void> {
    if (requester.isAdmin) {
      throw new AppError(403, 'Forbidden');
    }

    if (requester.isHealthProfessional) {
      const authorizedPatientIds =
        await this.getAuthorizedPatientIdsForProfessional(requester.sub);
      if (authorizedPatientIds.includes(patient._id)) return;
      throw new AppError(403, 'Forbidden');
    }

    if (patient.userId === requester.sub) return;
    throw new AppError(403, 'Forbidden');
  }

  private async enrichExam(
    exam: IExam,
    knownPatient?: IPatient,
    knownHealthUnit?: { name: string } | null,
  ): Promise<IExamWithContext> {
    const [patient, healthUnit] = await Promise.all([
      knownPatient
        ? Promise.resolve(knownPatient)
        : this.patientRepository.getPatientById(exam.patientId),
      knownHealthUnit
        ? Promise.resolve(knownHealthUnit)
        : this.healthUnitRepository.getHealthUnitById(exam.healthUnitId),
    ]);

    const user = patient
      ? await this.userRepository.findById(patient.userId)
      : null;

    const { filePublicId: _filePublicId, ...examWithoutPublicId } = exam;

    return {
      ...examWithoutPublicId,
      patientName: user?.name ?? '',
      patientCpf: patient?.cpf ?? '',
      healthUnitName: healthUnit?.name ?? '',
    };
  }
}
