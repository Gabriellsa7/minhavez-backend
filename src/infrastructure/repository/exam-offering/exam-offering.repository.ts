import { HydratedDocument } from 'mongoose';
import { IExamOfferingSchema } from '../../db/mongo/schema/exam-offering.schema';
import { IExamOffering } from '../../../domain/exam-offering/interfaces/exam-offering.interface';
import {
  IExamOfferingRepository,
  IParamsCreateExamOffering,
} from '../../../domain/exam-offering/repository/exam-offering.repository.interface';
import { MExamOffering } from '../../db/mongo/models/exam-offering.model';

export class ExamOfferingRepository implements IExamOfferingRepository {
  private mapToDomain(
    doc: HydratedDocument<IExamOfferingSchema>,
  ): IExamOffering {
    return {
      _id: doc._id.toString(),
      healthUnitId: doc.healthUnitId.toString(),
      name: doc.name,
      code: doc.code,
      description: doc.description,
      category: doc.category,
      sampleType: doc.sampleType,
      durationMinutes: doc.durationMinutes,
      resultTurnaroundEstimate: doc.resultTurnaroundEstimate,
      requiresPreparation: doc.requiresPreparation,
      preparationInstructions: doc.preparationInstructions,
      requiresFasting: doc.requiresFasting,
      fastingHours: doc.fastingHours,
      price: doc.price,
      acceptedInsurances: doc.acceptedInsurances,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async createExamOffering(
    data: IParamsCreateExamOffering,
  ): Promise<IExamOffering> {
    try {
      const doc = await MExamOffering.create(data);
      return this.mapToDomain(doc);
    } catch (error) {
      throw new Error(
        `Error creating exam offering: ${(error as Error).message}`,
      );
    }
  }

  async updateExamOfferingById(
    id: string,
    params: Partial<IExamOffering>,
  ): Promise<IExamOffering | null> {
    try {
      const doc = await MExamOffering.findByIdAndUpdate(id, params, {
        new: true,
      });
      return doc ? this.mapToDomain(doc) : null;
    } catch (error) {
      throw new Error(
        `Error updating exam offering: ${(error as Error).message}`,
      );
    }
  }

  async getExamOfferingById(id: string): Promise<IExamOffering | null> {
    try {
      const doc = await MExamOffering.findById(id);
      return doc ? this.mapToDomain(doc) : null;
    } catch (error) {
      throw new Error(
        `Error getting exam offering: ${(error as Error).message}`,
      );
    }
  }

  async listExamOfferingsByHealthUnitId(
    healthUnitId: string,
    includeInactive: boolean,
  ): Promise<IExamOffering[]> {
    try {
      const filter: Record<string, unknown> = { healthUnitId };
      if (!includeInactive) {
        filter.isActive = true;
      }
      const docs = await MExamOffering.find(filter).sort({ name: 1 });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing exam offerings: ${(error as Error).message}`,
      );
    }
  }
}
