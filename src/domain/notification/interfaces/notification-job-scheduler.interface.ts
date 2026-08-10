export interface INotificationJobScheduler {
  enqueue(payload: {
    notificationId: string;
    patientId: string;
    appointmentId?: string;
    scheduledAt?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<{ jobId: string; queue: string }>;
  enqueueAppointmentReminder(payload: {
    appointmentId: string;
    patientId: string;
    dateTime: Date;
  }): Promise<void>;
  enqueueReceipt(notificationId: string): Promise<void>;
  cancelJobsForAppointment(appointmentId: string): Promise<void>;
}
