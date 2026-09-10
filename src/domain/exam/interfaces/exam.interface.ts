export interface IExam {
  _id: string;
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
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ALLOWED_EXAM_MIME_TYPE = 'application/pdf';

export interface IExamWithContext extends Omit<IExam, 'filePublicId'> {
  patientName: string;
  patientCpf: string;
  healthUnitName: string;
}

export interface IExamWithFileUrl extends IExamWithContext {
  fileUrl: string;
}
