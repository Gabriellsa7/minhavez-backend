import { IUser } from '../interfaces/user.interface';
import {
  IParamsUserService,
  IUserService,
} from '../interfaces/user.service.interface';
import bcrypt from 'bcrypt';
import {
  IParamsCreateUser,
  IParamsUpdateUser,
  IUserRepository,
} from '../repository/user.repository.interface';

export class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(params: IParamsUserService) {
    this.userRepository = params.userRepository;
  }

  async createUser(params: IParamsCreateUser): Promise<IUser> {
    try {
      // Business logic (e.g., validation, ID/email uniqueness checks)
      const existingUser = await this.userRepository.findUserByEmail(
        params.email,
      );
      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(params.password, 10);

      return await this.userRepository.createUser({
        ...params,
        password: hashedPassword,
      });
    } catch (error) {
      throw new Error(`Error creating user: ${(error as Error).message}`);
    }
  }

  async getUserById(_id: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findUserById(_id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(
        `Error retrieving user by ID: ${(error as Error).message}`,
      );
    }
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(
        `Error retrieving user by email: ${(error as Error).message}`,
      );
    }
  }

  async updateUserById(
    _id: string,
    params: IParamsUpdateUser,
  ): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findUserById(_id);
      if (!user) {
        throw new Error('User not found');
      }

      return await this.userRepository.updateUserById(_id, params);
    } catch (error) {
      throw new Error(`Error updating user: ${(error as Error).message}`);
    }
  }

  async deleteUserById(_id: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findUserById(_id);
      if (!user) {
        throw new Error('User not found');
      }

      await this.userRepository.deleteUserById(_id);
      return user;
    } catch (error) {
      throw new Error(`Error deleting user: ${(error as Error).message}`);
    }
  }

  async listUsers(filter: Partial<IUser> = {}): Promise<IUser[]> {
    try {
      return await this.userRepository.listUsers(filter);
    } catch (error) {
      throw new Error(`Error listing users: ${(error as Error).message}`);
    }
  }
}
