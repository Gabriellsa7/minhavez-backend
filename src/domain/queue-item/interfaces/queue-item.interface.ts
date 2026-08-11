export interface IQueueItem {
  _id: string;
  queueId: string;
  patientId: string;
  code: string;
  position: number;
  priority: EQueueItemPriority;
  missedCalls: number;
  status: EQueueItemStatus;
  checkInTime?: Date;
  calledAt?: Date;
  finishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  /** Only populated by queries that join the professional's schedule (e.g. queue management). */
  estimatedWaitMinutes?: number | null;
}

export enum EQueueItemPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum EQueueItemStatus {
  WAITING = 'WAITING',
  IN_SERVICE = 'IN_SERVICE',
  FINISHED = 'FINISHED',
  ABSENT = 'ABSENT',
}
