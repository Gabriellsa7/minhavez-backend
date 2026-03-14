import {
  EQueueItemPriority,
  EQueueItemStatus,
  IQueueItem,
} from '../interfaces/queue-item.interface';

export interface IParamsCreateQueueItem {
  queueId: string;
  patientId: string;
  position: number;
  priority: EQueueItemPriority;
  status: EQueueItemStatus;
}

export interface IParamsUpdateQueueItem {
  queueItemData: Partial<IQueueItem>;
}

export interface IQueueItemRepository {
  createQueueItem(queueItemData: IParamsCreateQueueItem): Promise<IQueueItem>;
  updateQueueItemById(
    id: string,
    params: IParamsUpdateQueueItem,
  ): Promise<IQueueItem | null>;
  deleteQueueItemById(id: string): Promise<IQueueItem | null>;
  getQueueItemById(id: string): Promise<IQueueItem | null>;
  getQueueItemByPatientId(patientId: string): Promise<IQueueItem | null>;
  getQueueItemByQueueId(queueId: string): Promise<IQueueItem | null>;
  listQueueItems(filter: Partial<IQueueItem>): Promise<IQueueItem[]>;
}
