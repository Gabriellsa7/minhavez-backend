import { AppError } from '../../../shared/errors/AppError';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import {
  IExamOffering,
  IExamOfferingWithHealthUnit,
} from '../interfaces/exam-offering.interface';
import {
  IExamOfferingService,
  IParamsCreateExamOffering,
  IParamsExamOfferingService,
  IParamsUpdateExamOffering,
} from '../interfaces/exam-offering.service.interface';
import { IExamOfferingRepository } from '../repository/exam-offering.repository.interface';

export class ExamOfferingService implements IExamOfferingService {
  private examOfferingRepository: IExamOfferingRepository;
  private healthUnitRepository: IHealthUnitRepository;

  constructor(params: IParamsExamOfferingService) {
    this.examOfferingRepository = params.examOfferingRepository;
    this.healthUnitRepository = params.healthUnitRepository;
  }

  private async assertOwnsHealthUnit(
    healthUnitId: string,
    requestingAdminUserId: string,
  ) {
    const healthUnit =
      await this.healthUnitRepository.getHealthUnitById(healthUnitId);

    if (!healthUnit) {
      throw new AppError(404, 'Health unit not found');
    }

    if (healthUnit.userId !== requestingAdminUserId) {
      throw new AppError(
        403,
        'You can only manage exams for a health unit you own',
      );
    }

    return healthUnit;
  }

  private assertPreparationConsistency(params: {
    requiresPreparation?: boolean;
    preparationInstructions?: string;
  }) {
    if (params.requiresPreparation && !params.preparationInstructions) {
      throw new AppError(
        400,
        'preparationInstructions is required when requiresPreparation is true',
      );
    }
  }

  async createExamOffering(
    params: IParamsCreateExamOffering,
    requestingAdminUserId: string,
  ): Promise<IExamOffering> {
    if (!params.name) {
      throw new AppError(400, 'Exam name is required');
    }

    if (!params.durationMinutes || params.durationMinutes <= 0) {
      throw new AppError(400, 'durationMinutes must be greater than 0');
    }

    this.assertPreparationConsistency(params);

    await this.assertOwnsHealthUnit(
      params.healthUnitId,
      requestingAdminUserId,
    );

    return this.examOfferingRepository.createExamOffering({
      healthUnitId: params.healthUnitId,
      name: params.name,
      code: params.code,
      description: params.description,
      category: params.category,
      sampleType: params.sampleType,
      durationMinutes: params.durationMinutes,
      resultTurnaroundEstimate: params.resultTurnaroundEstimate,
      requiresPreparation: params.requiresPreparation ?? false,
      preparationInstructions: params.preparationInstructions,
      requiresFasting: params.requiresFasting ?? false,
      fastingHours: params.fastingHours,
      price: params.price,
      acceptedInsurances: params.acceptedInsurances ?? [],
    });
  }

  async updateExamOffering(
    id: string,
    params: IParamsUpdateExamOffering,
    requestingAdminUserId: string,
  ): Promise<IExamOffering> {
    const offering = await this.examOfferingRepository.getExamOfferingById(
      id,
    );

    if (!offering) {
      throw new AppError(404, 'Exam offering not found');
    }

    await this.assertOwnsHealthUnit(
      offering.healthUnitId,
      requestingAdminUserId,
    );

    this.assertPreparationConsistency({
      requiresPreparation: params.requiresPreparation ?? offering.requiresPreparation,
      preparationInstructions:
        params.preparationInstructions ?? offering.preparationInstructions,
    });

    if (
      params.durationMinutes !== undefined &&
      params.durationMinutes <= 0
    ) {
      throw new AppError(400, 'durationMinutes must be greater than 0');
    }

    const updated = await this.examOfferingRepository.updateExamOfferingById(
      id,
      params,
    );

    if (!updated) {
      throw new AppError(404, 'Exam offering not found');
    }

    return updated;
  }

  async getExamOfferingById(id: string): Promise<IExamOffering> {
    const offering = await this.examOfferingRepository.getExamOfferingById(
      id,
    );

    if (!offering) {
      throw new AppError(404, 'Exam offering not found');
    }

    return offering;
  }

  async listExamOfferingsByHealthUnitId(
    healthUnitId: string,
    requestingUserId: string | undefined,
    includeInactive: boolean,
  ): Promise<IExamOffering[]> {
    let canSeeInactive = false;

    if (includeInactive && requestingUserId) {
      const healthUnit =
        await this.healthUnitRepository.getHealthUnitById(healthUnitId);
      canSeeInactive = healthUnit?.userId === requestingUserId;
    }

    return this.examOfferingRepository.listExamOfferingsByHealthUnitId(
      healthUnitId,
      canSeeInactive,
    );
  }

  async listClinicsOfferingExam(
    examName: string,
  ): Promise<IExamOfferingWithHealthUnit[]> {
    if (!examName?.trim()) {
      throw new AppError(400, 'name is required');
    }

    const offerings = await this.examOfferingRepository.listActiveExamOfferingsByName(
      examName.trim(),
    );

    const healthUnits = await Promise.all(
      offerings.map((offering) =>
        this.healthUnitRepository.getHealthUnitById(offering.healthUnitId),
      ),
    );

    const enriched: IExamOfferingWithHealthUnit[] = [];

    offerings.forEach((offering, index) => {
      const healthUnit = healthUnits[index];
      if (!healthUnit) return;

      enriched.push({
        ...offering,
        healthUnitName: healthUnit.name,
        healthUnitAddress: healthUnit.address,
        healthUnitImg: healthUnit.img,
      });
    });

    return enriched;
  }
}
