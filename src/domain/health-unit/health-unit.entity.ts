import {
  IHealthUnit,
  IHealthUnitAddress,
  IService,
} from './interfaces/health-unit.interface';

export class HealthUnit implements IHealthUnit {
  _id: string;

  name: string;

  address: IHealthUnitAddress;

  phone: string;

  email: string;

  description?: string;

  services: IService[];

  img?: string;

  createdAt?: Date;

  updateAt?: Date;

  constructor(data: IHealthUnit) {
    this._id = data._id;
    this.name = data.name;
    this.address = data.address;
    this.phone = data.phone;
    this.description = data.description;
    this.services = data.services
    this.email = data.email;
    this.img = data.img;
    this.createdAt = data.createdAt;
    this.updateAt = data.updateAt;
  }
}
