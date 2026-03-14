import {
  EQueueItemPriority,
  EQueueItemStatus,
  IQueueItem,
} from './interfaces/queue-item.interface';

export class QueueItem implements IQueueItem {
  _id: string;

  queueId: string;

  patientId: string;

  position: number;

  priority: EQueueItemPriority;

  status: EQueueItemStatus;

  checkInTime?: Date | undefined;

  calledAt?: Date | undefined;

  finishedAt?: Date | undefined;

  createdAt?: Date | undefined;

  updatedAt?: Date | undefined;

  constructor(data: QueueItem) {
    this._id = data._id;
    this.queueId = data.queueId;
    this.patientId = data.patientId;
    this.position = data.position;
    this.priority = data.priority;
    this.status = data.status;
    this.checkInTime = data.checkInTime
      ? new Date(data.checkInTime)
      : data.checkInTime;
    this.calledAt = data.calledAt ? new Date(data.calledAt) : data.calledAt;
    this.finishedAt = data.finishedAt
      ? new Date(data.finishedAt)
      : data.finishedAt;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : data.createdAt;
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : data.updatedAt;
  }
}
