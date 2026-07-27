import { IPatient } from '../../patient/interfaces/patient.interface';
import { IQueueItem } from '../../queue-item/interfaces/queue-item.interface';
import { IUser } from '../../user/interfaces/user.interface';
import { IQueue } from './queue.interface';

export interface IQueueManagement {
  queue: IQueue;
  currentItem: IQueueManagementItem | null;
  items: IQueueManagementItem[];
}

export interface IQueueManagementItem {
  queueItem: IQueueItem;

  patient: IPatient;

  user: IUser;
}
