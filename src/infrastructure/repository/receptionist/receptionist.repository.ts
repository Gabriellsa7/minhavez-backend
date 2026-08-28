import { HydratedDocument } from 'mongoose';
import { IReceptionistSchema } from '../../db/mongo/schema/receptionist.schema';
import { IReceptionist } from '../../../domain/receptionist/interfaces/receptionist.interface';
import {
  IParamsCreateReceptionist,
  IParamsUpdateReceptionist,
  IReceptionistRepository,
} from '../../../domain/receptionist/repository/receptionist.repository.interface';
import { MReceptionist } from '../../db/mongo/models/receptionist.model';

export class ReceptionistRepository implements IReceptionistRepository {
  private mapToDomain(
    receptionistDoc: HydratedDocument<IReceptionistSchema>,
  ): IReceptionist {
    return {
      _id: receptionistDoc._id.toString(),
      healthUnitId: receptionistDoc.healthUnitId.toString(),
      name: receptionistDoc.name,
      email: receptionistDoc.email,
      password: receptionistDoc.password,
      active: receptionistDoc.active,
      avatar: receptionistDoc.avatar,
      createdAt: receptionistDoc.createdAt,
      updatedAt: receptionistDoc.updatedAt,
    };
  }

  async createReceptionist(
    receptionistData: IParamsCreateReceptionist,
  ): Promise<IReceptionist> {
    try {
      const receptionistDoc = await MReceptionist.create(receptionistData);
      return this.mapToDomain(receptionistDoc);
    } catch (error) {
      throw new Error(
        `Error creating receptionist: ${(error as Error).message}`,
      );
    }
  }

  async updateReceptionistById(
    _id: string,
    params: IParamsUpdateReceptionist,
  ): Promise<IReceptionist | null> {
    try {
      const receptionistDoc = await MReceptionist.findByIdAndUpdate(
        _id,
        params,
        { new: true },
      );

      if (!receptionistDoc) return null;

      return this.mapToDomain(receptionistDoc);
    } catch (error) {
      throw new Error(
        `Error updating receptionist: ${(error as Error).message}`,
      );
    }
  }

  async deleteReceptionistById(id: string): Promise<IReceptionist | null> {
    try {
      const receptionistDoc = await MReceptionist.findByIdAndDelete(id);

      if (!receptionistDoc) return null;

      return this.mapToDomain(receptionistDoc);
    } catch (error) {
      throw new Error(
        `Error deleting receptionist: ${(error as Error).message}`,
      );
    }
  }

  async getReceptionistById(id: string): Promise<IReceptionist | null> {
    try {
      const receptionistDoc = await MReceptionist.findById(id);

      if (!receptionistDoc) return null;

      return this.mapToDomain(receptionistDoc);
    } catch (error) {
      throw new Error(
        `Error fetching receptionist: ${(error as Error).message}`,
      );
    }
  }

  async listReceptionistsByHealthUnitId(
    healthUnitId: string,
  ): Promise<IReceptionist[]> {
    try {
      const receptionistDocs = await MReceptionist.find({
        healthUnitId,
      }).sort({ name: 1 });

      return receptionistDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error fetching receptionists by health unit ID: ${(error as Error).message}`,
      );
    }
  }

  async findReceptionistByEmailWithPassword(
    email: string,
  ): Promise<(IReceptionist & { password: string }) | null> {
    try {
      const receptionist = await MReceptionist.findOne({ email }).select(
        '+password',
      );

      if (!receptionist) {
        return null;
      }

      return {
        _id: receptionist._id.toString(),
        healthUnitId: receptionist.healthUnitId.toString(),
        name: receptionist.name,
        email: receptionist.email,
        password: receptionist.password,
        active: receptionist.active,
        avatar: receptionist.avatar,
        createdAt: receptionist.createdAt,
        updatedAt: receptionist.updatedAt,
      };
    } catch (error) {
      throw new Error(
        `Error finding receptionist by email: ${(error as Error).message}`,
      );
    }
  }
}
