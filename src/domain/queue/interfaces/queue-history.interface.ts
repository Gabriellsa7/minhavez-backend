import { IPatient } from '../../patient/interfaces/patient.interface';
import { IQueueItem } from '../../queue-item/interfaces/queue-item.interface';
import { IUser } from '../../user/interfaces/user.interface';
import { EQueueShift } from './queue.interface';

export interface IQueueHistoryEntry {
  queueItem: IQueueItem;
  patient: IPatient;
  user: IUser;
  queueDate: Date;
  shift: EQueueShift;
}

export interface IQueueHistoryFilter {
  startDate?: Date;
  endDate?: Date;
}
