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
  createdAt: Date;
  updatedAt: Date;
}

export const ALLOWED_EXAM_MIME_TYPE = 'application/pdf';

/** Exam enriched with display-only fields joined from Patient/User/HealthUnit,
 * used by list endpoints so cards don't need extra round trips.
 * Omits `filePublicId` — it's a Cloudinary storage detail, never returned to clients. */
export interface IExamWithContext extends Omit<IExam, 'filePublicId'> {
  patientName: string;
  patientCpf: string;
  healthUnitName: string;
}

/** Exam enriched the same way plus a freshly-signed, non-guessable, inline-viewable
 * file URL, regenerated on every request and never persisted. Only returned by the
 * single-exam detail endpoint, never by listings. */
export interface IExamWithFileUrl extends IExamWithContext {
  fileUrl: string;
}
