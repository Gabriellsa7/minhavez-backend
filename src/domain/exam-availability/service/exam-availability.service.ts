import { AppError } from '../../../shared/errors/AppError';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import {
  IExamAvailabilityBlackout,
  IExamAvailabilityRule,
} from '../interfaces/exam-availability.interface';
import {
  IExamAvailabilityService,
  IParamsExamAvailabilityService,
} from '../interfaces/exam-availability.service.interface';
import {
  IExamAvailabilityRepository,
  IParamsUpsertExamAvailabilityRule,
} from '../repository/exam-availability.repository.interface';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class ExamAvailabilityService implements IExamAvailabilityService {
  private examAvailabilityRepository: IExamAvailabilityRepository;
  private healthUnitRepository: IHealthUnitRepository;

  constructor(params: IParamsExamAvailabilityService) {
    this.examAvailabilityRepository = params.examAvailabilityRepository;
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
        'You can only manage availability for a health unit you own',
      );
    }
  }

  async upsertRules(
    healthUnitId: string,
    rules: IParamsUpsertExamAvailabilityRule[],
    requestingAdminUserId: string,
  ): Promise<IExamAvailabilityRule[]> {
    await this.assertOwnsHealthUnit(healthUnitId, requestingAdminUserId);

    for (const rule of rules) {
      if (!TIME_REGEX.test(rule.startTime) || !TIME_REGEX.test(rule.endTime)) {
        throw new AppError(400, 'startTime/endTime must be in HH:mm format');
      }
      if (rule.startTime >= rule.endTime) {
        throw new AppError(400, 'startTime must be before endTime');
      }
      if (!rule.slotDurationMinutes || rule.slotDurationMinutes <= 0) {
        throw new AppError(400, 'slotDurationMinutes must be greater than 0');
      }
      if (!rule.capacityPerSlot || rule.capacityPerSlot <= 0) {
        throw new AppError(400, 'capacityPerSlot must be greater than 0');
      }
    }

    return this.examAvailabilityRepository.replaceRulesForHealthUnit(
      healthUnitId,
      rules,
    );
  }

  async listRulesByHealthUnitId(
    healthUnitId: string,
  ): Promise<IExamAvailabilityRule[]> {
    return this.examAvailabilityRepository.listRulesByHealthUnitId(
      healthUnitId,
    );
  }

  async addBlackout(
    healthUnitId: string,
    date: Date,
    reason: string | undefined,
    requestingAdminUserId: string,
  ): Promise<IExamAvailabilityBlackout> {
    await this.assertOwnsHealthUnit(healthUnitId, requestingAdminUserId);

    try {
      return await this.examAvailabilityRepository.createBlackout(
        healthUnitId,
        date,
        reason,
      );
    } catch (error) {
      const mongoError = error as { code?: number };
      if (mongoError.code === 11000) {
        throw new AppError(409, 'This date is already blacked out');
      }
      throw error;
    }
  }

  async removeBlackout(
    id: string,
    requestingAdminUserId: string,
  ): Promise<void> {
    const blackout = await this.examAvailabilityRepository.getBlackoutById(
      id,
    );

    if (!blackout) {
      throw new AppError(404, 'Blackout not found');
    }

    await this.assertOwnsHealthUnit(
      blackout.healthUnitId,
      requestingAdminUserId,
    );

    await this.examAvailabilityRepository.deleteBlackoutById(id);
  }

  async listBlackoutsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IExamAvailabilityBlackout[]> {
    return this.examAvailabilityRepository.listBlackoutsByHealthUnitId(
      healthUnitId,
    );
  }
}
