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
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export enum EQueueType {
  WALK_IN = 'SPONTANEOUS',
  SCHEDULED = 'SCHEDULED',
}
