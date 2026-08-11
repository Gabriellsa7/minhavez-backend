import { HydratedDocument } from 'mongoose';
import { IExamSchema } from '../../db/mongo/schema/exam.schema';
import { IExam } from '../../../domain/exam/interfaces/exam.interface';
import {
  IExamRepository,
  IParamsCreateExam,
} from '../../../domain/exam/repository/exam.repository.interface';
import { MExam } from '../../db/mongo/models/exam.model';

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

  async listExamsByPatientId(patientId: string): Promise<IExam[]> {
    try {
      const examDocs = await MExam.find({ patientId }).sort({
        createdAt: -1,
      });
      return examDocs.map((doc) => this.mapToDomain(doc));
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
}
