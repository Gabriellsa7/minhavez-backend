import {
  IParamsCreateQueue,
  IParamsUpdateQueue,
  IQueueRepository,
} from '../repository/queue.repository.interface';
import { IQueueItemRepository } from '../../queue-item/repository/queue-item.repository.interface';
import { IQueue } from './queue.interface';

export interface IParamsService {
  queueRepository: IQueueRepository;
  queueItemRepository: IQueueItemRepository;
}

export interface IQueueService {
  createQueue(params: IParamsCreateQueue): Promise<IQueue>;
  getQueueById(_id: string): Promise<IQueue | null>;
  getQueuesByPatientId(patientId: string): Promise<IQueue[]>;
  updateQueueById(
    _id: string,
    params: IParamsUpdateQueue,
  ): Promise<IQueue | null>;
  deleteQueueById(_id: string): Promise<IQueue | null>;
  listQueues(filter?: Partial<IQueue>): Promise<IQueue[]>;
}
