import { HydratedDocument } from 'mongoose';
import { IQueueItem } from '../../../domain/queue-item/interfaces/queue-item.interface';
import { IQueueItemSchema } from '../../db/mongo/schema/queue-item.schema';
import {
  IParamsCreateQueueItem,
  IParamsUpdateQueueItem,
  IQueueItemRepository,
} from '../../../domain/queue-item/repository/queue-item.repository.interface';
import { MQueueItem } from '../../db/mongo/models/queue-item.model';

export class QueueItemRepository implements IQueueItemRepository {
  private mapToDomain(
    queueItemDoc: HydratedDocument<IQueueItemSchema>,
  ): IQueueItem {
    return {
      _id: queueItemDoc._id.toString(),
      queueId: queueItemDoc.queueId.toString(),
      patientId: queueItemDoc.patientId.toString(),
      position: queueItemDoc.position,
      priority: queueItemDoc.priority,
      status: queueItemDoc.status,
      checkInTime: queueItemDoc.checkInTime,
      calledAt: queueItemDoc.calledAt,
      finishedAt: queueItemDoc.finishedAt,
      createdAt: queueItemDoc.createdAt,
      updatedAt: queueItemDoc.updatedAt,
    };
  }

  async createQueueItem(
    queueItemData: IParamsCreateQueueItem,
  ): Promise<IQueueItem> {
    try {
      const queueItemDoc = await MQueueItem.create(queueItemData);
      return this.mapToDomain(queueItemDoc);
    } catch (error) {
      throw new Error(`Error creating queue item: ${(error as Error).message}`);
    }
  }

  async updateQueueItemById(
    id: string,
    params: IParamsUpdateQueueItem,
  ): Promise<IQueueItem | null> {
    try {
      const queueItemDoc = await MQueueItem.findByIdAndUpdate(id, params, {
        new: true,
      });

      if (!queueItemDoc) return null;

      return this.mapToDomain(queueItemDoc);
    } catch (error) {
      throw new Error(
        `Error updating queue item by ID: ${(error as Error).message}`,
      );
    }
  }

  async deleteQueueItemById(id: string): Promise<IQueueItem | null> {
    try {
      const queueItemDoc = await MQueueItem.findByIdAndDelete(id);
      if (!queueItemDoc) return null;

      return this.mapToDomain(queueItemDoc);
    } catch (error) {
      throw new Error(
        `Error deleting queue item by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemById(id: string): Promise<IQueueItem | null> {
    try {
      const queueItemDoc = await MQueueItem.findById(id);
      if (!queueItemDoc) return null;

      return this.mapToDomain(queueItemDoc);
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemByPatientId(patientId: string): Promise<IQueueItem | null> {
    try {
      const queueItemDoc = await MQueueItem.findOne({ patientId });
      if (!queueItemDoc) return null;

      return this.mapToDomain(queueItemDoc);
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemByQueueId(queueId: string): Promise<IQueueItem | null> {
    try {
      const queueItemDoc = await MQueueItem.findOne({ queueId });
      if (!queueItemDoc) return null;

      return this.mapToDomain(queueItemDoc);
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by queue ID: ${(error as Error).message}`,
      );
    }
  }

  async listQueueItems(filter: Partial<IQueueItem>): Promise<IQueueItem[]> {
    try {
      const queueItemDocs = await MQueueItem.find(filter);
      return queueItemDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(`Error listing queue items: ${(error as Error).message}`);
    }
  }
}
