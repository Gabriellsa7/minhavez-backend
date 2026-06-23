import {
  IHealthUnit,
  IHealthUnitAddress,
} from './interfaces/health-unit.interface';

export class HealthUnit implements IHealthUnit {
  _id: string;

  name: string;

  address: IHealthUnitAddress;

  phone: string;

  email: string;

  img?: string;

  createdAt: Date;

  constructor(data: IHealthUnit) {
    this._id = data._id;
    this.name = data.name;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
    this.img = data.img;
    this.createdAt = data.createdAt;
  }
}
