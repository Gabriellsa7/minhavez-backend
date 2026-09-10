export interface IQueueItem {
  _id: string;
  queueId: string;
  patientId: string;
  code: string;
  position: number | null;
  priority: EQueueItemPriority;
  missedCalls: number;
  status: EQueueItemStatus;
  scheduledDateTime: Date;
  isWalkIn: boolean;
  positionRevealedAt?: Date | null;
  checkInTime?: Date;
  calledAt?: Date;
  finishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

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

  QUEUE_CLOSED = 'QUEUE_CLOSED',
}
