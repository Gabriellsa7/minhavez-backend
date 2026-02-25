import { HydratedDocument } from 'mongoose';
import { IUser } from '../../../domain/user/interfaces/user.interface';
import { Muser } from '../../db/mongo/models/user.model';
import { IUserSchema } from '../../db/mongo/schema/user.schema';
import {
  IParamsCreateUser,
  IParamsUpdateUser,
  IUserRepository,
} from '../../../domain/user/repository/user.repository.interface';

export class UserRepository implements IUserRepository {
  private mapToDomain(userDoc: HydratedDocument<IUserSchema>): IUser {
    return {
      _id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      active: userDoc.active,
      createdAt: userDoc.createdAt,
    };
  }

  async createUser(userData: IParamsCreateUser): Promise<IUser> {
    try {
      const userDoc = await Muser.create(userData);
      return this.mapToDomain(userDoc);
    } catch (error) {
      throw new Error(`Error creating user: ${(error as Error).message}`);
    }
  }

  async updateUserById(
    _id: string,
    params: IParamsUpdateUser,
  ): Promise<IUser | null> {
    try {
      const userDoc = await Muser.findByIdAndUpdate(_id, params, {
        new: true,
      });

      if (!userDoc) return null;

      return this.mapToDomain(userDoc);
    } catch (error) {
      throw new Error(`Error updating user by ID: ${(error as Error).message}`);
    }
  }

  async deleteUserById(id: string): Promise<IUser | null> {
    try {
      const userDoc = await Muser.findByIdAndDelete(id);

      if (!userDoc) return null;

      return this.mapToDomain(userDoc);
    } catch (error) {
      throw new Error(`Error deleting user by ID: ${(error as Error).message}`);
    }
  }

  async findUserById(id: string): Promise<IUser | null> {
    try {
      return await Muser.findOne({ _id: id });
    } catch (error) {
      throw new Error(`Error finding user by ID: ${(error as Error).message}`);
    }
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    try {
      return await Muser.findOne({ email });
    } catch (error) {
      throw new Error(
        `Error finding user by email: ${(error as Error).message}`,
      );
    }
  }

  async listUsers(filter: Partial<IUser>): Promise<IUser[]> {
    try {
      return await Muser.find(filter);
    } catch (error) {
      throw new Error(`Error listing users: ${(error as Error).message}`);
    }
  }
}
