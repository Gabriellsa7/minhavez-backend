export interface IHealthProfessional {
  _id: string;
  userId: string;
  healthUnitId: string;
  specialty: string;
  professionalLicense: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
