export interface IQueueItem {
  _id: string;
  queueId: string;
  patientId: string;
  position: number;
  priority: EQueueItemPriority;
  status: EQueueItemStatus;
  checkInTime?: Date;
  calledAt?: Date;
  finishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum EQueueItemPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum EQueueItemStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  FINISHED = 'FINISHED',
}
