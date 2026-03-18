export interface INotification {
  _id: string;
  patientId: string;
  queueItemId?: string;
  appointmentId?: string;
  type: ENotificationType;
  title: string;
  message: string;
  read: boolean;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum ENotificationType {
  REMINDER = 'REMINDER',
  QUEUE_NEAR = 'QUEUE_NEAR',
  QUEUE_NEXT = 'QUEUE_NEXT',
  QUEUE_CALLED = 'QUEUE_CALLED',
}
