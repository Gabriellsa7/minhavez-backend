import { IExam } from '../interfaces/exam.interface';
import { IPaginationParams } from '../../../shared/utils/pagination';

export interface IParamsCreateExam {
  patientId: string;
  healthUnitId: string;
  uploadedByUserId: string;
  examType: string;
  examDate?: Date | null;
  doctorName?: string;
  notes?: string;
  filePublicId: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  examBookingId?: string | null;
}

export interface IExamRepository {
  createExam(examData: IParamsCreateExam): Promise<IExam>;
  getExamById(id: string): Promise<IExam | null>;
  listExamsByPatientId(
    patientId: string,
    pagination?: IPaginationParams | null,
  ): Promise<{ items: IExam[]; totalItems: number }>;
  listExamsByHealthUnitId(healthUnitId: string): Promise<IExam[]>;
  listExamsByPatientIds(patientIds: string[]): Promise<IExam[]>;
  setExamBookingId(examId: string, examBookingId: string): Promise<void>;
  incrementDownloadCount(id: string): Promise<IExam | null>;
}
