import { HydratedDocument } from 'mongoose';
import {
  ICreateUser,
  IUser,
} from '../../../domain/user/interfaces/user.interface';
import { Muser } from '../../db/mongo/models/user.model';
import { IUserSchema } from '../../db/mongo/schema/user.schema';

export class UserRepositoryWrite {
  private mapToDomain(userDoc: HydratedDocument<IUserSchema>): IUser {
    return {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      active: userDoc.active,
      createdAt: userDoc.createdAt,
    };
  }

  async createUser(userData: ICreateUser): Promise<IUser> {
    try {
      const userDoc = await Muser.create(userData);
      return this.mapToDomain(userDoc);
    } catch (error) {
      throw new Error(`Error creating user: ${(error as Error).message}`);
    }
  }

  async updateUserById(
    id: string,
    updateData: Partial<IUser>,
  ): Promise<IUser | null> {
    try {
      const userDoc = await Muser.findByIdAndUpdate(id, updateData, {
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
}
