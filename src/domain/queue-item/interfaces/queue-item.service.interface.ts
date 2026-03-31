import {
  IParamsCreateQueueItem,
  IParamsUpdateQueueItem,
  IQueueItemRepository,
} from '../repository/queue-item.repository.interface';
import { IQueueItem } from './queue-item.interface';

export interface IParamsQueueItemService {
  queueItemRepository: IQueueItemRepository;
}

export interface IQueueItemService {
  createQueueItem(params: IParamsCreateQueueItem): Promise<IQueueItem>;
  getQueueItemById(_id: string): Promise<IQueueItem | null>;
  getQueueItemsByPatientId(patientId: string): Promise<IQueueItem[]>;
  getQueueItemByQueueId(queueId: string): Promise<IQueueItem | null>;
  updateQueueItemById(
    _id: string,
    params: IParamsUpdateQueueItem,
  ): Promise<IQueueItem | null>;
  deleteQueueItemById(_id: string): Promise<IQueueItem | null>;
  listQueueItem(filter: Partial<IQueueItem>): Promise<IQueueItem[]>;
}
