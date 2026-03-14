export interface INotification {
  _id: string;
  patientId: string;
  title: string;
  message: string;
  read: boolean;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
