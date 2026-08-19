import { HydratedDocument } from 'mongoose';
import { IExamSchema } from '../../db/mongo/schema/exam.schema';
import { IExam } from '../../../domain/exam/interfaces/exam.interface';
import {
  IExamRepository,
  IParamsCreateExam,
} from '../../../domain/exam/repository/exam.repository.interface';
import { MExam } from '../../db/mongo/models/exam.model';
import { IPaginationParams } from '../../../shared/utils/pagination';

export class ExamRepository implements IExamRepository {
  private mapToDomain(examDoc: HydratedDocument<IExamSchema>): IExam {
    return {
      _id: examDoc._id.toString(),
      patientId: examDoc.patientId.toString(),
      healthUnitId: examDoc.healthUnitId.toString(),
      uploadedByUserId: examDoc.uploadedByUserId.toString(),
      examType: examDoc.examType,
      examDate: examDoc.examDate ?? null,
      doctorName: examDoc.doctorName,
      notes: examDoc.notes,
      filePublicId: examDoc.filePublicId,
      fileName: examDoc.fileName,
      mimeType: examDoc.mimeType,
      fileSize: examDoc.fileSize,
      examBookingId: examDoc.examBookingId?.toString() ?? null,
      downloadCount: examDoc.downloadCount ?? 0,
      createdAt: examDoc.createdAt,
      updatedAt: examDoc.updatedAt,
    };
  }

  async createExam(examData: IParamsCreateExam): Promise<IExam> {
    try {
      const examDoc = await MExam.create(examData);
      return this.mapToDomain(examDoc);
    } catch (error) {
      throw new Error(`Error creating exam: ${(error as Error).message}`);
    }
  }

  async getExamById(id: string): Promise<IExam | null> {
    try {
      const examDoc = await MExam.findById(id);

      if (!examDoc) return null;

      return this.mapToDomain(examDoc);
    } catch (error) {
      throw new Error(`Error getting exam: ${(error as Error).message}`);
    }
  }

  async listExamsByPatientId(
    patientId: string,
    pagination?: IPaginationParams | null,
  ): Promise<{ items: IExam[]; totalItems: number }> {
    try {
      const mongoFilter = { patientId };
      const [examDocs, totalItems] = await Promise.all([
        MExam.find(mongoFilter)
          .sort({ createdAt: -1 })
          .skip(pagination?.skip ?? 0)
          .limit(pagination?.limit ?? 0),
        MExam.countDocuments(mongoFilter),
      ]);
      return {
        items: examDocs.map((doc) => this.mapToDomain(doc)),
        totalItems,
      };
    } catch (error) {
      throw new Error(
        `Error listing exams by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async listExamsByHealthUnitId(healthUnitId: string): Promise<IExam[]> {
    try {
      const examDocs = await MExam.find({ healthUnitId }).sort({
        createdAt: -1,
      });
      return examDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing exams by health unit ID: ${(error as Error).message}`,
      );
    }
  }

  async listExamsByPatientIds(patientIds: string[]): Promise<IExam[]> {
    try {
      const examDocs = await MExam.find({
        patientId: { $in: patientIds },
      }).sort({ createdAt: -1 });
      return examDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing exams by patient IDs: ${(error as Error).message}`,
      );
    }
  }

  async setExamBookingId(
    examId: string,
    examBookingId: string,
  ): Promise<void> {
    try {
      await MExam.findByIdAndUpdate(examId, { examBookingId });
    } catch (error) {
      throw new Error(
        `Error linking exam to booking: ${(error as Error).message}`,
      );
    }
  }

  async incrementDownloadCount(id: string): Promise<IExam | null> {
    try {
      const examDoc = await MExam.findOneAndUpdate(
        { _id: id },
        { $inc: { downloadCount: 1 } },
        { new: true },
      );

      if (!examDoc) return null;

      return this.mapToDomain(examDoc);
    } catch (error) {
      throw new Error(
        `Error incrementing exam download count: ${(error as Error).message}`,
      );
    }
  }
}
