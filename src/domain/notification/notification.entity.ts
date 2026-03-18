import {
  ENotificationType,
  INotification,
} from './interfaces/notification.interface';

export class Notidication implements INotification {
  _id: string;

  patientId: string;

  queueItemId?: string | undefined;

  appointmentId?: string | undefined;

  title: string;

  type: ENotificationType;

  message: string;

  read: boolean;

  sentAt?: Date | null | undefined;

  updatedAt: Date;

  createdAt: Date;

  constructor(data: INotification) {
    this._id = data._id;
    this.patientId = data.patientId;
    this.queueItemId = data.queueItemId;
    this.appointmentId = data.appointmentId;
    this.title = data.title;
    this.type = data.type;
    this.message = data.message;
    this.read = data.read;
    this.sentAt = data.sentAt;
    this.updatedAt = data.updatedAt;
    this.createdAt = data.createdAt;
  }
}
