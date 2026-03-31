import { IQueueItem } from '../interfaces/queue-item.interface';
import {
  IParamsCreateQueueItem,
  IParamsUpdateQueueItem,
  IQueueItemRepository,
} from '../repository/queue-item.repository.interface';
import {
  IParamsQueueItemService,
  IQueueItemService,
} from '../interfaces/queue-item.service.interface';

export class QueueItemService implements IQueueItemService {
  private queueItemRepository: IQueueItemRepository;

  constructor(params: IParamsQueueItemService) {
    this.queueItemRepository = params.queueItemRepository;
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

  async getQueueItemByQueueId(queueId: string): Promise<IQueueItem | null> {
    try {
      const queueItem =
        await this.queueItemRepository.getQueueItemByQueueId(queueId);
      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      return queueItem;
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

  async listQueueItem(filter: Partial<IQueueItem>): Promise<IQueueItem[]> {
    try {
      return await this.queueItemRepository.listQueueItems(filter);
    } catch (error) {
      throw new Error(`Error listing queue items: ${(error as Error).message}`);
    }
  }
}
