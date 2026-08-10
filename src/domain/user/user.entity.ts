import { IUser, EUserRole } from './interfaces/user.interface';

export class User implements IUser {
  _id: string;

  name: string;

  email: string;

  avatar?: string | null;

  role?: EUserRole;

  active?: boolean;

  createdAt: Date;

  constructor(data: IUser) {
    this._id = data._id;
    this.name = data.name;
    this.email = data.email;
    this.avatar = data.avatar;
    this.role = data.role;
    this.active = data.active;
    this.createdAt = data.createdAt;
  }
}
