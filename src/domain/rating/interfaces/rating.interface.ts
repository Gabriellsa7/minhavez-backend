export interface IRating {
  _id: string;
  appointmentId: string;
  patientId: string;
  professionalId: string;
  healthUnitId: string;
  professionalStars?: number;
  professionalComment?: string;
  clinicStars?: number;
  clinicComment?: string;
  createdAt: Date;
  updatedAt: Date;
}
