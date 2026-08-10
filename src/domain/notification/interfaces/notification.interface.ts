export interface INotification {
  _id: string;
  patientId: string;
  queueItemId?: string;
  appointmentId?: string;
  type: ENotificationType;
  title: string;
  message: string;
  read: boolean;
  status?: ENotificationStatus;
  provider?: string;
  providerResponse?: Record<string, unknown>;
  lastError?: string | null;
  attempts?: number;
  expiresAt?: Date | null;
  deliveredAt?: Date | null;
  deviceToken?: string | null;
  metadata?: Record<string, unknown>;
  priority?: number;
  data?: Record<string, unknown>;
  scheduledAt?: Date | null;
  sentAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum ENotificationType {
  REMINDER = 'REMINDER',
  QUEUE_NEAR = 'QUEUE_NEAR',
  QUEUE_NEXT = 'QUEUE_NEXT',
  QUEUE_CALLED = 'QUEUE_CALLED',
}

export enum ENotificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
  CANCELLED = 'CANCELLED',
}
