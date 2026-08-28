import { IReceptionist } from './interfaces/receptionist.interface';

export class Receptionist implements IReceptionist {
  _id: string;
  healthUnitId: string;
  name: string;
  email: string;
  password: string;
  active: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: IReceptionist) {
    this._id = data._id;
    this.healthUnitId = data.healthUnitId;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.active = data.active;
    this.avatar = data.avatar;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
