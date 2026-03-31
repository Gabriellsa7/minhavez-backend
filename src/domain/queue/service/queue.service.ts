import { EQueueStatus, IQueue } from '../interfaces/queue.interface';
import { IQueueService } from '../interfaces/queue.service.interface';
import {
  IParamsCreateQueue,
  IParamsUpdateQueue,
  IQueueRepository,
} from '../repository/queue.repository.interface';
import { IQueueItemRepository } from '../../queue-item/repository/queue-item.repository.interface';

export class QueueService implements IQueueService {
  private queueRepository: IQueueRepository;
  private queueItemRepository: IQueueItemRepository;

  constructor(params: {
    queueRepository: IQueueRepository;
    queueItemRepository: IQueueItemRepository;
  }) {
    this.queueRepository = params.queueRepository;
    this.queueItemRepository = params.queueItemRepository;
  }

  async createQueue(params: IParamsCreateQueue): Promise<IQueue> {
    try {
      if (params.status === 'OPEN') {
        const existingOpenQueue = await this.queueRepository.listQueues({
          professionalId: params.professionalId,
          status: EQueueStatus.OPEN,
        });

        if (existingOpenQueue.length > 0) {
          throw new Error('Already has an open queue');
        }
      }
      return await this.queueRepository.createQueue(params);
    } catch (error) {
      throw new Error(`Error creating queue: ${(error as Error).message}`);
    }
  }

  async getQueueById(id: string): Promise<IQueue | null> {
    try {
      const queue = await this.queueRepository.getQueueById(id);

      if (!queue) {
        throw new Error('Queue not found');
      }

      return queue;
    } catch (error) {
      throw new Error(
        `Error retrieving queue by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueuesByPatientId(patientId: string): Promise<IQueue[]> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemsByPatientId(patientId);
      const queueIds = [...new Set(queueItems.map((item) => item.queueId))];
      const queues = await Promise.all(
        queueIds.map((id) => this.queueRepository.getQueueById(id)),
      );
      return queues.filter((queue) => queue !== null) as IQueue[];
    } catch (error) {
      throw new Error(
        `Error retrieving queues by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async updateQueueById(
    _id: string,
    params: IParamsUpdateQueue,
  ): Promise<IQueue | null> {
    try {
      const updatedQueue = await this.queueRepository.updateQueueById(
        _id,
        params,
      );

      if (!updatedQueue) {
        throw new Error('Queue not found');
      }

      return updatedQueue;
    } catch (error) {
      throw new Error(`Error updating queue: ${(error as Error).message}`);
    }
  }

  async deleteQueueById(id: string): Promise<IQueue | null> {
    try {
      const deletedQueue = await this.queueRepository.deleteQueueById(id);

      if (!deletedQueue) {
        throw new Error('Queue not found');
      }

      return deletedQueue;
    } catch (error) {
      throw new Error(`Error deleting queue: ${(error as Error).message}`);
    }
  }

  async listQueues(filter: Partial<IQueue>): Promise<IQueue[]> {
    try {
      return await this.queueRepository.listQueues(filter);
    } catch (error) {
      throw new Error(`Error listing queues: ${(error as Error).message}`);
    }
  }
}
