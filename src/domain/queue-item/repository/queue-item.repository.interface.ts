import {
  EQueueItemPriority,
  EQueueItemStatus,
  IQueueItem,
} from '../interfaces/queue-item.interface';

export interface IParamsCreateQueueItem {
  queueId: string;
  patientId: string;
  code?: string;
  position: number;
  priority: EQueueItemPriority;
  status: EQueueItemStatus;
}

export type IParamsUpdateQueueItem = Partial<IQueueItem>;

export interface IQueueItemRepository {
  createQueueItem(queueItemData: IParamsCreateQueueItem): Promise<IQueueItem>;
  updateQueueItemById(
    id: string,
    params: IParamsUpdateQueueItem,
  ): Promise<IQueueItem | null>;
  deleteQueueItemById(id: string): Promise<IQueueItem | null>;
  getQueueItemById(id: string): Promise<IQueueItem | null>;
  getQueueItemsByPatientId(patientId: string): Promise<IQueueItem[]>;
  getQueueItemByQueueId(queueId: string): Promise<IQueueItem[] | null>;
  getQueueItemByProfessionalId(
    professionalId: string,
  ): Promise<IQueueItem[] | null>;
  getNextWaitingQueueItem(queueId: string): Promise<IQueueItem | null>;
  getLastQueuePosition(queueId: string): Promise<number>;
  listQueueItems(filter: Partial<IQueueItem>): Promise<IQueueItem[]>;
}
