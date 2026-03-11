export interface IQueue {
  _id: string;
  professionalId: string;
  healthUnitId: string;
  status: EQueueStatus;
  type: EQueueType;
  openedAt?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum EQueueStatus {
  OPEN = 'OPEN',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
}

export enum EQueueType {
  WALK_IN = 'WALK_IN',
  SCHEDULED = 'SCHEDULED',
}
