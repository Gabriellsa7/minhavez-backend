export interface IHealthProfessional {
  _id: string;
  userId?: string;
  healthUnitId: string;
  specialty: string;
  name:string;
  email:string;
  password:string;
  professionalLicense: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
