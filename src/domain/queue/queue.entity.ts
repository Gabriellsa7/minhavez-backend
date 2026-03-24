import { EQueueStatus, IQueue } from './interfaces/queue.interface';

export class Queue implements IQueue {
  _id: string;

  professionalId: string;

  healthUnitId: string;

  status: EQueueStatus;

  openedAt?: Date;

  closedAt?: Date;

  createdAt: Date;

  updatedAt: Date;

  constructor(data: Queue) {
    this._id = data._id;
    this.professionalId = data.professionalId;
    this.healthUnitId = data.healthUnitId;
    this.status = data.status;
    this.openedAt = data.openedAt ? new Date(data.openedAt) : undefined;
    this.closedAt = data.closedAt ? new Date(data.closedAt) : undefined;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
  }
}
