import { IPatient } from '../../patient/interfaces/patient.interface';
import { IQueueItem } from '../../queue-item/interfaces/queue-item.interface';
import { IUser } from '../../user/interfaces/user.interface';
import { IQueue } from './queue.interface';

export interface IQueueManagement {
  queue: IQueue;
  currentItem: IQueueManagementItem | null;
  items: IQueueManagementItem[];
  /** The item that should be called next, honoring the priority/normal round-robin. */
  nextQueueItemId: string | null;
}

export interface IQueueManagementItem {
  queueItem: IQueueItem;

  patient: IPatient;

  user: IUser;

  /** True when the appointment behind this queue item was created via "Marcar Retorno" by the professional. */
  isReturn: boolean;

  /** True once the professional has scheduled a return for this appointment, allowing it to be finished. */
  returnScheduled: boolean;
}
