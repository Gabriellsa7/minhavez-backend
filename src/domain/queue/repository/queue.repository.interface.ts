import {
  EQueueStatus,
  EQueueType,
  IQueue,
} from '../interfaces/queue.interface';

export interface IParamsCreateQueue {
  professionalId: string;
  healthUnitId: string;
  status: EQueueStatus;
  type: EQueueType;
}

export interface IParamsUpdateQueue {
  queueData: Partial<IParamsCreateQueue>;
}

export interface IQueueRepository {
  createQueue(queueData: IParamsCreateQueue): Promise<IQueue>;
  updateQueueById(
    id: string,
    params: IParamsUpdateQueue,
  ): Promise<IQueue | null>;
  deleteQueueById(id: string): Promise<IQueue | null>;
  getQueueById(id: string): Promise<IQueue | null>;
  listQueues(filter: Partial<IQueue>): Promise<IQueue[]>;
}
