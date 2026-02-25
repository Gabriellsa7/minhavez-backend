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

  /**
   * Create a new user
   * @param params - The user data to create
   * @returns The created user document
   */
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

  /**
   * Get a user by ID
   * @param id - The user's ID
   * @returns The user document or null if not found
   */
  async getUserById(id: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findUserById(id);
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

  /**
   * Get a user by email
   * @param email - The user's email
   * @returns The user document or null if not found
   */
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

  /**
   * Update a user's information by ID
   * @param id - The user's ID
   * @param updateData - The data to update
   * @returns The updated user document or null if not found
   */
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

  /**
   * Delete a user by ID
   * @param id - The user's ID
   * @returns The deleted user document or null if not found
   */
  async deleteUserById(id: string): Promise<IUser | null> {
    try {
      const user = await this.userRepository.findUserById(id);
      if (!user) {
        throw new Error('User not found');
      }

      await this.userRepository.deleteUserById(id);
      return user;
    } catch (error) {
      throw new Error(`Error deleting user: ${(error as Error).message}`);
    }
  }

  /**
   * List all users with optional filters
   * @param filter - Filters for the query
   * @returns An array of user documents
   */
  async listUsers(filter: Partial<IUser> = {}): Promise<IUser[]> {
    try {
      return await this.userRepository.listUsers(filter);
    } catch (error) {
      throw new Error(`Error listing users: ${(error as Error).message}`);
    }
  }
}
