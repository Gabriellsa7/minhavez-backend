export interface INotificationJobScheduler {
  enqueue(payload: {
    notificationId: string;
    patientId: string;
    appointmentId?: string;
    scheduledAt?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<{ jobId: string; queue: string }>;
  enqueueReceipt(notificationId: string): Promise<void>;
  cancelJobsForAppointment(appointmentId: string): Promise<void>;
}
