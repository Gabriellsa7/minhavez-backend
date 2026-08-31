export interface IPrescriptionExam {
  examOfferingId: string;
  examOfferingName: string;
}

export interface IPrescription {
  _id: string;
  patientId: string;
  professionalId: string;
  healthUnitId: string;
  queueItemId?: string | null;
  medications?: string;
  observations?: string;
  exams: IPrescriptionExam[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPrescriptionWithContext extends IPrescription {
  patientName: string;
  professionalName: string;
  healthUnitName: string;
}
