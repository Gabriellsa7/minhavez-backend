import {
  EQueueItemStatus,
  IQueueItem,
} from '../interfaces/queue-item.interface';
import {
  IParamsCreateQueueItem,
  IParamsUpdateQueueItem,
  IQueueItemRepository,
} from '../repository/queue-item.repository.interface';
import { IQueueItemService } from '../interfaces/queue-item.service.interface';
import { IQueueRepository } from '../../queue/repository/queue.repository.interface';
import { EQueueStatus } from '../../queue/interfaces/queue.interface';

export class QueueItemService implements IQueueItemService {
  private queueItemRepository: IQueueItemRepository;
  private queueRepository: IQueueRepository;

  constructor(params: {
    queueItemRepository: IQueueItemRepository;
    queueRepository: IQueueRepository;
  }) {
    this.queueItemRepository = params.queueItemRepository;
    this.queueRepository = params.queueRepository;
  }

  async createQueueItem(params: IParamsCreateQueueItem): Promise<IQueueItem> {
    try {
      return await this.queueItemRepository.createQueueItem(params);
    } catch (error) {
      throw new Error(`Error creating queue item: ${(error as Error).message}`);
    }
  }

  async getQueueItemById(_id: string): Promise<IQueueItem | null> {
    try {
      const queueItem = await this.queueItemRepository.getQueueItemById(_id);
      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      return queueItem;
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemsByPatientId(patientId: string): Promise<IQueueItem[]> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemsByPatientId(patientId);
      return queueItems;
    } catch (error) {
      throw new Error(
        `Error retrieving queue items by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemByProfessionalId(
    professionalId: string,
  ): Promise<IQueueItem[] | null> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemByProfessionalId(
          professionalId,
        );

      return queueItems;
    } catch (error) {
      throw new Error(
        `Error retrieving queue items by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemByQueueId(queueId: string): Promise<IQueueItem[] | null> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemByQueueId(queueId);
      if (!queueItems) {
        throw new Error('Queue item not found');
      }

      return queueItems;
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by queue ID: ${(error as Error).message}`,
      );
    }
  }

  async updateQueueItemById(
    _id: string,
    params: IParamsUpdateQueueItem,
  ): Promise<IQueueItem | null> {
    try {
      const updatedQueueItem =
        await this.queueItemRepository.updateQueueItemById(_id, params);

      if (!updatedQueueItem) {
        throw new Error('Queue item not found');
      }

      return updatedQueueItem;
    } catch (error) {
      throw new Error(`Error updating queue item: ${(error as Error).message}`);
    }
  }

  async deleteQueueItemById(_id: string): Promise<IQueueItem | null> {
    try {
      const deletedQueueItem =
        await this.queueItemRepository.deleteQueueItemById(_id);

      if (!deletedQueueItem) {
        throw new Error('Queue item not found');
      }

      return deletedQueueItem;
    } catch (error) {
      throw new Error(`Error deleting queue item: ${(error as Error).message}`);
    }
  }

  private async closeQueueIfEmpty(queueId: string): Promise<void> {
    try {
      const queueItems = await this.queueItemRepository.listQueueItems({
        queueId,
      });

      const hasPendingItems = queueItems.some(
        (item) =>
          item.status === EQueueItemStatus.WAITING ||
          item.status === EQueueItemStatus.IN_SERVICE,
      );

      if (!hasPendingItems) {
        await this.queueRepository.updateQueueById(queueId, {
          status: EQueueStatus.CLOSED,
          closedAt: new Date(),
        });
      }
    } catch (error) {
      throw new Error(
        `Error finishing queue item: ${(error as Error).message}`,
      );
    }
  }

  async finishQueueItem(queueItemId: string): Promise<IQueueItem> {
    try {
      const queueItem =
        await this.queueItemRepository.getQueueItemById(queueItemId);

      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      const updatedQueueItem =
        await this.queueItemRepository.updateQueueItemById(queueItemId, {
          status: EQueueItemStatus.FINISHED,
          finishedAt: new Date(),
        });

      await this.closeQueueIfEmpty(queueItem.queueId);

      return updatedQueueItem!;
    } catch (error) {
      throw new Error(
        `Error finishing queue item: ${(error as Error).message}`,
      );
    }
  }

  async markQueueItemAsAbsent(queueItemId: string): Promise<IQueueItem> {
    try {
      const queueItem =
        await this.queueItemRepository.getQueueItemById(queueItemId);

      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      const updatedQueueItem =
        await this.queueItemRepository.updateQueueItemById(queueItemId, {
          status: EQueueItemStatus.ABSENT,
          finishedAt: new Date(),
        });

      await this.closeQueueIfEmpty(queueItem.queueId);

      return updatedQueueItem!;
    } catch (error) {
      throw new Error(
        `Error finishing queue item: ${(error as Error).message}`,
      );
    }
  }

  async listQueueItem(filter: Partial<IQueueItem>): Promise<IQueueItem[]> {
    try {
      return await this.queueItemRepository.listQueueItems(filter);
    } catch (error) {
      throw new Error(`Error listing queue items: ${(error as Error).message}`);
    }
  }
}
