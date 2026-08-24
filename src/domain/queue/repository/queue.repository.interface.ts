import { IQueueManagement } from '../interfaces/queue-management.interface';
import {
  IQueueHistoryEntry,
  IQueueHistoryFilter,
} from '../interfaces/queue-history.interface';
import {
  EQueueShift,
  EQueueStatus,
  IHealthUnitQueueSummary,
  IQueue,
} from '../interfaces/queue.interface';

export interface IParamsCreateQueue {
  professionalId: string;
  healthUnitId: string;
  status: EQueueStatus;
  queueDate?: Date;
  shift?: EQueueShift;
}

export type IParamsUpdateQueue = Partial<IQueue>;
export interface IQueueRepository {
  createQueue(queueData: IParamsCreateQueue): Promise<IQueue>;
  updateQueueById(
    id: string,
    params: IParamsUpdateQueue,
  ): Promise<IQueue | null>;
  deleteQueueById(id: string): Promise<IQueue | null>;
  getQueueByProfessionalId(professionalId: string): Promise<IQueue | null>;
  getQueueManagementByProfessionalId(
    professionalId: string,
  ): Promise<IQueueManagement | null>;
  getQueueById(id: string): Promise<IQueue | null>;
  findOpenQueueByProfessionalIdAndShift(
    professionalId: string,
    shift: EQueueShift,
  ): Promise<IQueue | null>;
  getQueuesByProfessionalId(professionalId: string): Promise<IQueue[]>;
  listQueues(filter: Partial<IQueue>): Promise<IQueue[]>;
  getQueueHistoryByProfessionalId(
    professionalId: string,
    filter?: IQueueHistoryFilter,
  ): Promise<IQueueHistoryEntry[]>;
  getHealthUnitQueueSummary(
    healthUnitId: string,
  ): Promise<IHealthUnitQueueSummary>;
}
