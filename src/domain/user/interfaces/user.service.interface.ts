import { IUserRepositoryRead } from '../repository/user.repository.read';
import { IUserRepositoryWrite } from '../repository/user.repository.write';
import { IUser } from './user.interface';

export interface IParamsCreateUser {
  name: string;
  email: string;
  password: string;
}

export interface IParamsUpdateUser {
  id: string;
  userData: Partial<IUser>;
}

export interface IParamsUserService {
  userRepositoryRead: IUserRepositoryRead;
  userRepositoryWrite: IUserRepositoryWrite;
}

export interface IUserService {
  createUser(params: IParamsCreateUser): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  updateUserById(id: string, params: IParamsUpdateUser): Promise<IUser | null>;
  deleteUserById(id: string): Promise<IUser | null>;
  listUsers(filter: Partial<IUser>): Promise<IUser[]>;
}
