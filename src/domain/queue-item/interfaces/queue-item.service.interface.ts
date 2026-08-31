import {
  IParamsCreateQueueItem,
  IParamsUpdateQueueItem,
  IQueueItemRepository,
} from '../repository/queue-item.repository.interface';
import { IPrescriptionRepository } from '../../prescription/repository/prescription.repository.interface';
import { IQueueItem } from './queue-item.interface';

export interface IParamsQueueItemService {
  queueItemRepository: IQueueItemRepository;
  prescriptionRepository: IPrescriptionRepository;
}

export interface IQueueItemService {
  createQueueItem(params: IParamsCreateQueueItem): Promise<IQueueItem>;
  getQueueItemById(_id: string): Promise<IQueueItem | null>;
  getQueueItemsByPatientId(patientId: string): Promise<IQueueItem[]>;
  getQueueItemByQueueId(queueId: string): Promise<IQueueItem[] | null>;
  getQueueItemByProfessionalId(
    professionalId: string,
  ): Promise<IQueueItem[] | null>;
  updateQueueItemById(
    _id: string,
    params: IParamsUpdateQueueItem,
  ): Promise<IQueueItem | null>;
  deleteQueueItemById(_id: string): Promise<IQueueItem | null>;
  finishQueueItem(queueItemId: string): Promise<IQueueItem>;
  markQueueItemAsAbsent(queueItemId: string): Promise<IQueueItem>;
  callQueueItem(id: string): Promise<IQueueItem>;
  listQueueItem(filter: Partial<IQueueItem>): Promise<IQueueItem[]>;
}
