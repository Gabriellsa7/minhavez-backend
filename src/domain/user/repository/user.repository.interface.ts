import { IUser } from '../interfaces/user.interface';

export interface IParamsCreateUser {
  name: string;
  email: string;
  password: string;
}

export interface IParamsUpdateUser {
  userData: Partial<IUser>;
}

export interface IUserRepository {
  createUser(userData: IParamsCreateUser): Promise<IUser>;
  updateUserById(id: string, params: IParamsUpdateUser): Promise<IUser | null>;
  deleteUserById(id: string): Promise<IUser | null>;
  findUserByEmail(email: string): Promise<IUser | null>;
  findUserById(id: string): Promise<IUser | null>;
  listUsers(filter: Partial<IUser>): Promise<IUser[]>;
}
