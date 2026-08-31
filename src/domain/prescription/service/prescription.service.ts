import { AppError } from '../../../shared/errors/AppError';
import { IExamOfferingRepository } from '../../exam-offering/repository/exam-offering.repository.interface';
import { IPatientRepository } from '../../patient/repository/patient.repository.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import {
  IPrescription,
  IPrescriptionExam,
  IPrescriptionWithContext,
} from '../interfaces/prescription.interface';
import {
  IParamsCreatePrescription,
  IParamsPrescriptionService,
  IPrescriptionRequester,
  IPrescriptionService,
} from '../interfaces/prescription.service.interface';
import { IPrescriptionRepository } from '../repository/prescription.repository.interface';

export class PrescriptionService implements IPrescriptionService {
  private prescriptionRepository: IPrescriptionRepository;
  private examOfferingRepository: IExamOfferingRepository;
  private patientRepository: IPatientRepository;
  private userRepository: IUserRepository;

  constructor(params: IParamsPrescriptionService) {
    this.prescriptionRepository = params.prescriptionRepository;
    this.examOfferingRepository = params.examOfferingRepository;
    this.patientRepository = params.patientRepository;
    this.userRepository = params.userRepository;
  }

  private async enrich(
    prescription: IPrescription,
  ): Promise<IPrescriptionWithContext> {
    const patient = await this.patientRepository.getPatientById(
      prescription.patientId,
    );
    const user = patient
      ? await this.userRepository.findById(patient.userId)
      : null;

    return {
      ...prescription,
      patientName: user?.name ?? '',
    };
  }

  private resolveProfessionalAndHealthUnit(
    params: IParamsCreatePrescription,
    requester: IPrescriptionRequester,
  ): { professionalId: string; healthUnitId: string } {
    const professionalId = requester.isAdmin
      ? params.professionalId
      : requester.sub;
    const healthUnitId = requester.isAdmin
      ? params.healthUnitId
      : requester.healthUnitId;

    if (!professionalId || !healthUnitId) {
      throw new AppError(400, 'professionalId and healthUnitId are required');
    }

    return { professionalId, healthUnitId };
  }

  private async resolveExams(
    exams: IParamsCreatePrescription['exams'],
    healthUnitId: string,
  ): Promise<IPrescriptionExam[]> {
    if (!exams || exams.length === 0) {
      throw new AppError(400, 'At least one exam is required');
    }

    const resolved: IPrescriptionExam[] = [];

    for (const exam of exams) {
      const offering = await this.examOfferingRepository.getExamOfferingById(
        exam.examOfferingId,
      );

      if (!offering || offering.healthUnitId !== healthUnitId) {
        throw new AppError(400, 'Exame inválido para esta unidade de saúde');
      }

      resolved.push({
        examOfferingId: offering._id,
        examOfferingName: offering.name,
      });
    }

    return resolved;
  }

  async createPrescription(
    params: IParamsCreatePrescription,
    requester: IPrescriptionRequester,
  ): Promise<IPrescriptionWithContext> {
    if (!params.patientId) {
      throw new AppError(400, 'patientId is required');
    }

    const { professionalId, healthUnitId } =
      this.resolveProfessionalAndHealthUnit(params, requester);

    const exams = await this.resolveExams(params.exams, healthUnitId);

    const prescription = await this.prescriptionRepository.create({
      patientId: params.patientId,
      professionalId,
      healthUnitId,
      queueItemId: params.queueItemId,
      medications: params.medications,
      observations: params.observations,
      exams,
    });

    return this.enrich(prescription);
  }

  async getPrescriptionById(id: string): Promise<IPrescriptionWithContext> {
    const prescription = await this.prescriptionRepository.findById(id);

    if (!prescription) {
      throw new AppError(404, 'Prescription not found');
    }

    return this.enrich(prescription);
  }

  async listPrescriptionsByPatientId(
    patientId: string,
  ): Promise<IPrescriptionWithContext[]> {
    const prescriptions =
      await this.prescriptionRepository.findByPatientId(patientId);

    return Promise.all(
      prescriptions.map((prescription) => this.enrich(prescription)),
    );
  }

  async listPrescriptionsByProfessionalId(
    professionalId: string,
    requester: IPrescriptionRequester,
  ): Promise<IPrescriptionWithContext[]> {
    if (!requester.isAdmin && requester.sub !== professionalId) {
      throw new AppError(403, 'Forbidden');
    }

    const prescriptions =
      await this.prescriptionRepository.findByProfessionalId(professionalId);

    return Promise.all(
      prescriptions.map((prescription) => this.enrich(prescription)),
    );
  }
}
