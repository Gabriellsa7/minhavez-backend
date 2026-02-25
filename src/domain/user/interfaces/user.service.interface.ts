import {
  IParamsCreateUser,
  IParamsUpdateUser,
  IUserRepository,
} from '../repository/user.repository.interface';
import { IUser } from './user.interface';

export interface IParamsUserService {
  userRepository: IUserRepository;
}

export interface IUserService {
  createUser(params: IParamsCreateUser): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  updateUserById(_id: string, params: IParamsUpdateUser): Promise<IUser | null>;
  deleteUserById(id: string): Promise<IUser | null>;
  listUsers(filter: Partial<IUser>): Promise<IUser[]>;
}
