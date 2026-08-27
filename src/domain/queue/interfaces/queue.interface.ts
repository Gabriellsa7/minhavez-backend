export interface IQueue {
  _id: string;
  professionalId: string;
  healthUnitId: string;
  status: EQueueStatus;
  shift: EQueueShift;
  queueDate: Date;
  openedAt?: Date | null;
  closedAt?: Date | null;
  closeReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum EQueueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export enum EQueueShift {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
}

export interface IHealthUnitQueueSummary {
  hasOpenQueue: boolean;
  waitingCount: number;
  estimatedWaitMinutes: number | null;
}
