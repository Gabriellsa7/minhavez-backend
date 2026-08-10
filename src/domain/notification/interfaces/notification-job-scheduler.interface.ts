export interface INotificationJobScheduler {
  enqueue(payload: {
    notificationId: string;
    patientId: string;
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
