import { HydratedDocument } from 'mongoose';
import { IQueue } from '../../../domain/queue/interfaces/queue.interface';
import { IQueueSchema } from '../../db/mongo/schema/queue.schema';
import {
  IParamsCreateQueue,
  IParamsUpdateQueue,
  IQueueRepository,
} from '../../../domain/queue/repository/queue.repository.interface';
import { Muser } from '../../db/mongo/models/queue.model';

export class QueueRepository implements IQueueRepository {
  private mapToDomain(queueDoc: HydratedDocument<IQueueSchema>): IQueue {
    return {
      _id: queueDoc._id.toString(),
      professionalId: queueDoc.professionalId.toString(),
      healthUnitId: queueDoc.healthUnitId.toString(),
      status: queueDoc.status,
      openedAt: queueDoc.openedAt,
      closedAt: queueDoc.closedAt,
      createdAt: queueDoc.createdAt,
      updatedAt: queueDoc.updatedAt,
    };
  }

  async createQueue(queueData: IParamsCreateQueue): Promise<IQueue> {
    try {
      const queueDoc = await Muser.create(queueData);
      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(`Error creating queue: ${(error as Error).message}`);
    }
  }

  async updateQueueById(
    _id: string,
    params: IParamsUpdateQueue,
  ): Promise<IQueue | null> {
    try {
      const queueDoc = await Muser.findByIdAndUpdate(_id, params, {
        new: true,
      });

      if (!queueDoc) return null;

      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(`Error updating queue: ${(error as Error).message}`);
    }
  }

  async deleteQueueById(id: string): Promise<IQueue | null> {
    try {
      const queueDoc = await Muser.findByIdAndDelete(id);

      if (!queueDoc) return null;

      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(`Error deleting queue: ${(error as Error).message}`);
    }
  }

  async getQueueById(id: string): Promise<IQueue | null> {
    try {
      const queueDoc = await Muser.findById(id);

      if (!queueDoc) return null;

      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(
        `Error retrieving queue by ID: ${(error as Error).message}`,
      );
    }
  }

  async listQueues(filter: Partial<IQueue>): Promise<IQueue[]> {
    try {
      const queueDocs = await Muser.find(filter);
      return queueDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(`Error listing queues: ${(error as Error).message}`);
    }
  }
}
