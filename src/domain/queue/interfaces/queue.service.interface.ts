import {
  IParamsCreateQueue,
  IParamsUpdateQueue,
  IQueueRepository,
} from '../repository/queue.repository.interface';
import { IQueueItemRepository } from '../../queue-item/repository/queue-item.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IQueue } from './queue.interface';
import { IQueueManagement } from './queue-management.interface';

export interface IParamsService {
  queueRepository: IQueueRepository;
  queueItemRepository: IQueueItemRepository;
  healthUnitRepository: IHealthUnitRepository;
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

  //TODO: think a new logic to show queue to professional
  //Fordi the faktisk logic is allow open a queue that has end, when have closedAt don't the queue

  //TODO: Add a new logic to have just to queue in en dag one in the morning and another on afternoon, based on professional avaliable time
  //Change the logic of creating a queue, fordi nå, is created a queue for each appointment in diferent Tid of the day

  //TODO: Add new logic to not show appoitment on app whe is completed

  //TODO: add status in all return on controller the same as in getQueuesByProfessionalId, better create a ErroHandle
  openQueue(queueId: string): Promise<IQueue>;
  closeQueue(queueId: string): Promise<IQueue>;
  getQueuesByProfessionalId(professionalId: string): Promise<IQueue[]>;
  listQueues(filter: Partial<IQueue>): Promise<IQueue[]>;
}

export interface IQueueWithDetails extends IQueue {
  healthUnitName: string;
  queueSize: number;
  patientCode?: string;
}
