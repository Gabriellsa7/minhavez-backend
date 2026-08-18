export interface IPatient {
  _id: string;
  userId: string;
  cpf: string;
  birthDate: string;
  priority: EPatientPriority;
  phone: string;
  bloodType?: EBloodType;
  allergies?: string;
  medicalObservations?: string;
  medicalDocuments: IPatientMedicalDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export enum EPatientPriority {
  NORMAL = 'NORMAL',
  ELDERLY = 'ELDERLY',
  PREGNANT = 'PREGNANT',
  DISABLED = 'DISABLED',
  CHRONIC_CONDITION = 'CHRONIC_CONDITION',
}

export enum EBloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export const ALLOWED_PATIENT_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export type TPatientDocumentMimeType =
  (typeof ALLOWED_PATIENT_DOCUMENT_MIME_TYPES)[number];

export const PATIENT_DOCUMENT_FORMAT_BY_MIME: Record<
  TPatientDocumentMimeType,
  string
> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export const MAX_PATIENT_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export interface IPatientMedicalDocument {
  _id: string;
  filePublicId: string;
  fileFormat: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  uploadedAt: Date;
}

/** Safe-to-return shape — omits Cloudinary storage details, same precedent as
 * exams stripping `filePublicId` before responses reach clients. */
export type IPatientMedicalDocumentPublic = Omit<
  IPatientMedicalDocument,
  'filePublicId' | 'fileFormat'
>;
