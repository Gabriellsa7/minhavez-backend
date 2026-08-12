import { IRating } from './interfaces/rating.interface';

export class Rating implements IRating {
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

  constructor(data: IRating) {
    this._id = data._id;
    this.appointmentId = data.appointmentId;
    this.patientId = data.patientId;
    this.professionalId = data.professionalId;
    this.healthUnitId = data.healthUnitId;
    this.professionalStars = data.professionalStars;
    this.professionalComment = data.professionalComment;
    this.clinicStars = data.clinicStars;
    this.clinicComment = data.clinicComment;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
