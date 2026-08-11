import {
  IParamsCreateQueue,
  IParamsUpdateQueue,
  IQueueRepository,
} from '../repository/queue.repository.interface';
import { IQueueItemRepository } from '../../queue-item/repository/queue-item.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IHealthProfessionalRepository } from '../../health-professional.ts/repository/health-professional.repository.interface';
import { IQueue } from './queue.interface';
import { IQueueManagement } from './queue-management.interface';

export interface IParamsService {
  queueRepository: IQueueRepository;
  queueItemRepository: IQueueItemRepository;
  healthUnitRepository: IHealthUnitRepository;
  healthProfessionalRepository: IHealthProfessionalRepository;
}

export interface IQueueService {
  createQueue(params: IParamsCreateQueue): Promise<IQueue>;
  getQueueById(_id: string): Promise<IQueue | null>;
  getQueuesByPatientId(patientId: string): Promise<IQueue[]>;
  getQueuesWithDetailsByPatientId(
    patientId: string,
  ): Promise<IQueueWithDetails[]>;
  getQueueByProfessionalId(professionalId: string): Promise<IQueue | null>;
  getQueueManagementByProfessionalId(
    professionalId: string,
  ): Promise<IQueueManagement | null>;
  updateQueueById(
    _id: string,
    params: IParamsUpdateQueue,
  ): Promise<IQueue | null>;
  deleteQueueById(_id: string): Promise<IQueue | null>;
  openQueue(queueId: string): Promise<IQueue>;
  closeQueue(queueId: string): Promise<IQueue>;
  getQueuesByProfessionalId(professionalId: string): Promise<IQueue[]>;
  listQueues(filter: Partial<IQueue>): Promise<IQueue[]>;
}

export interface IQueueWithDetails extends IQueue {
  healthUnitName: string;
  queueSize: number;
  patientCode?: string;
  estimatedWaitMinutes?: number | null;
}
