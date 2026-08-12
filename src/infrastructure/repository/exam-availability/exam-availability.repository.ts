import { HydratedDocument } from 'mongoose';
import { IExamAvailabilityRuleSchema } from '../../db/mongo/schema/exam-availability-rule.schema';
import { IExamAvailabilityBlackoutSchema } from '../../db/mongo/schema/exam-availability-blackout.schema';
import {
  IExamAvailabilityBlackout,
  IExamAvailabilityRule,
} from '../../../domain/exam-availability/interfaces/exam-availability.interface';
import {
  IExamAvailabilityRepository,
  IParamsUpsertExamAvailabilityRule,
} from '../../../domain/exam-availability/repository/exam-availability.repository.interface';
import { MExamAvailabilityRule } from '../../db/mongo/models/exam-availability-rule.model';
import { MExamAvailabilityBlackout } from '../../db/mongo/models/exam-availability-blackout.model';

export class ExamAvailabilityRepository implements IExamAvailabilityRepository {
  private mapRuleToDomain(
    doc: HydratedDocument<IExamAvailabilityRuleSchema>,
  ): IExamAvailabilityRule {
    return {
      _id: doc._id.toString(),
      healthUnitId: doc.healthUnitId.toString(),
      weekday: doc.weekday,
      startTime: doc.startTime,
      endTime: doc.endTime,
      slotDurationMinutes: doc.slotDurationMinutes,
      capacityPerSlot: doc.capacityPerSlot,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private mapBlackoutToDomain(
    doc: HydratedDocument<IExamAvailabilityBlackoutSchema>,
  ): IExamAvailabilityBlackout {
    return {
      _id: doc._id.toString(),
      healthUnitId: doc.healthUnitId.toString(),
      date: doc.date,
      reason: doc.reason,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async replaceRulesForHealthUnit(
    healthUnitId: string,
    rules: IParamsUpsertExamAvailabilityRule[],
  ): Promise<IExamAvailabilityRule[]> {
    try {
      await MExamAvailabilityRule.deleteMany({ healthUnitId });

      if (rules.length === 0) {
        return [];
      }

      const docs = await MExamAvailabilityRule.create(
        rules.map((rule) => ({ ...rule, healthUnitId })),
      );

      return docs.map((doc) => this.mapRuleToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error replacing exam availability rules: ${(error as Error).message}`,
      );
    }
  }

  async listRulesByHealthUnitId(
    healthUnitId: string,
  ): Promise<IExamAvailabilityRule[]> {
    try {
      const docs = await MExamAvailabilityRule.find({ healthUnitId }).sort({
        weekday: 1,
        startTime: 1,
      });
      return docs.map((doc) => this.mapRuleToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing exam availability rules: ${(error as Error).message}`,
      );
    }
  }

  async createBlackout(
    healthUnitId: string,
    date: Date,
    reason?: string,
  ): Promise<IExamAvailabilityBlackout> {
    const doc = await MExamAvailabilityBlackout.create({
      healthUnitId,
      date,
      reason,
    });
    return this.mapBlackoutToDomain(doc);
  }

  async getBlackoutById(
    id: string,
  ): Promise<IExamAvailabilityBlackout | null> {
    try {
      const doc = await MExamAvailabilityBlackout.findById(id);
      return doc ? this.mapBlackoutToDomain(doc) : null;
    } catch (error) {
      throw new Error(
        `Error getting exam availability blackout: ${(error as Error).message}`,
      );
    }
  }

  async deleteBlackoutById(id: string): Promise<void> {
    try {
      await MExamAvailabilityBlackout.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(
        `Error deleting exam availability blackout: ${(error as Error).message}`,
      );
    }
  }

  async listBlackoutsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IExamAvailabilityBlackout[]> {
    try {
      const docs = await MExamAvailabilityBlackout.find({
        healthUnitId,
      }).sort({ date: 1 });
      return docs.map((doc) => this.mapBlackoutToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing exam availability blackouts: ${(error as Error).message}`,
      );
    }
  }

  async isDateBlackedOut(healthUnitId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const doc = await MExamAvailabilityBlackout.findOne({
      healthUnitId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    return !!doc;
  }
}
