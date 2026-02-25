import { IUser, EUserRole } from './interfaces/user.interface';

export class User implements IUser {
  _id: string;

  name: string;

  email: string;

  role?: EUserRole;

  active?: boolean;

  createdAt: Date;

  constructor(data: IUser) {
    this._id = data._id;
    this.name = data.name;
    this.email = data.email;
    this.role = data.role;
    this.active = data.active;
    this.createdAt = data.createdAt;
  }
}
