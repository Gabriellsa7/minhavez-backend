import { HydratedDocument } from 'mongoose';
import {
  EQueueItemPriority,
  EQueueItemStatus,
  IQueueItem,
} from '../../../domain/queue-item/interfaces/queue-item.interface';
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
      code: queueItemDoc.code,
      position: queueItemDoc.position,
      priority: queueItemDoc.priority,
      missedCalls: queueItemDoc.missedCalls,
      status: queueItemDoc.status,
      checkInTime: queueItemDoc.checkInTime,
      calledAt: queueItemDoc.calledAt,
      finishedAt: queueItemDoc.finishedAt,
      createdAt: queueItemDoc.createdAt,
      updatedAt: queueItemDoc.updatedAt,
    };
  }

  private getQueueItemCodePrefix(priority: EQueueItemPriority): string {
    return priority === EQueueItemPriority.HIGH ? 'AP' : 'AN';
  }

  private async generateQueueItemCode(
    queueId: string,
    priority: EQueueItemPriority,
  ): Promise<string> {
    const prefix = this.getQueueItemCodePrefix(priority);
    const count = await MQueueItem.countDocuments({
      queueId,
      code: { $regex: `^${prefix}\\d{3}$` },
    });

    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  async createQueueItem(
    queueItemData: IParamsCreateQueueItem,
  ): Promise<IQueueItem> {
    const maxAttempts = 5;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        const code =
          queueItemData.code ??
          (await this.generateQueueItemCode(
            queueItemData.queueId,
            queueItemData.priority,
          ));

        const queueItemDoc = await MQueueItem.create({
          ...queueItemData,
          code,
        });

        return this.mapToDomain(queueItemDoc);
      } catch (error) {
        const queueError = error as { code?: number };
        const duplicateKey = queueError.code === 11000;

        if (duplicateKey && attempt < maxAttempts - 1) {
          attempt += 1;
          continue;
        }

        throw new Error(
          `Error creating queue item: ${(error as Error).message}`,
        );
      }
    }

    throw new Error('Failed to generate a unique queue item code');
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

  async getQueueItemsByPatientId(patientId: string): Promise<IQueueItem[]> {
    try {
      const queueItemDocs = await MQueueItem.find({ patientId });
      return queueItemDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error retrieving queue items by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemByQueueId(queueId: string): Promise<IQueueItem[] | null> {
    try {
      const queueItemDocs = await MQueueItem.find({ queueId });
      if (!queueItemDocs) return null;

      return queueItemDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by queue ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemByProfessionalId(
    professionalId: string,
  ): Promise<IQueueItem[] | null> {
    try {
      const queueItemDocs = await MQueueItem.find({ professionalId });
      return queueItemDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by queue ID: ${(error as Error).message}`,
      );
    }
  }

  async getNextWaitingQueueItem(queueId: string): Promise<IQueueItem | null> {
    const doc = await MQueueItem.findOne({
      queueId,
      status: EQueueItemStatus.WAITING,
    }).sort({
      position: 1,
    });

    return doc ? this.mapToDomain(doc) : null;
  }

  async getLastCalledQueueItem(queueId: string): Promise<IQueueItem | null> {
    const doc = await MQueueItem.findOne({
      queueId,
      calledAt: { $ne: null },
    }).sort({
      calledAt: -1,
    });

    return doc ? this.mapToDomain(doc) : null;
  }

  async getNextWaitingQueueItemByPriorityGroup(
    queueId: string,
    isPriority: boolean,
  ): Promise<IQueueItem | null> {
    const doc = await MQueueItem.findOne({
      queueId,
      status: EQueueItemStatus.WAITING,
      priority: isPriority
        ? EQueueItemPriority.HIGH
        : { $ne: EQueueItemPriority.HIGH },
    }).sort({
      position: 1,
    });

    return doc ? this.mapToDomain(doc) : null;
  }

  async getLastQueuePosition(queueId: string): Promise<number> {
    const last = await MQueueItem.findOne({
      queueId,
    }).sort({
      position: -1,
    });

    return last?.position ?? 0;
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
