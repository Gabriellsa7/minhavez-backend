export interface IReceptionist {
  _id: string;
  healthUnitId: string;
  name: string;
  email: string;
  password: string;
  active: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
