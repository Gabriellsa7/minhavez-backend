import { Logger } from 'traceability';
import {
  ENotificationStatus,
  ENotificationType,
  INotification,
} from '../interfaces/notification.interface';
import {
  IParamsCreateNotification,
  IParamsUpdateNotification,
  INotificationRepository,
} from '../repository/notification.repository.interface';
import {
  IParamsNotificationService,
  INotificationService,
} from '../interfaces/notification.service.interface';
import { INotificationProvider } from '../interfaces/notification-provider.interface';
import { INotificationJobScheduler } from '../interfaces/notification-job-scheduler.interface';
import { INotificationSocketGateway } from '../interfaces/notification-socket.interface';
import { notificationConfig } from '../../../infrastructure/config/notification.constants';
import { IPatientRepository } from '../../patient/repository/patient.repository.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';

export class NotificationService implements INotificationService {
  private notificationRepository: INotificationRepository;
  private notificationProvider?: INotificationProvider;
  private notificationJobScheduler?: INotificationJobScheduler;
  private notificationSocketGateway?: INotificationSocketGateway;

  constructor(
    params: IParamsNotificationService & {
      notificationProvider?: INotificationProvider;
      notificationJobScheduler?: INotificationJobScheduler;
      notificationSocketGateway?: INotificationSocketGateway;
      patientRepository?: IPatientRepository;
      userRepository?: IUserRepository;
    },
  ) {
    this.notificationRepository = params.notificationRepository;
    this.notificationProvider = params.notificationProvider;
    this.notificationJobScheduler = params.notificationJobScheduler;
    this.notificationSocketGateway = params.notificationSocketGateway;
    this.patientRepository = params.patientRepository;
    this.userRepository = params.userRepository;
  }
  private patientRepository?: IPatientRepository;
  private userRepository?: IUserRepository;

  async createNotification(
    params: IParamsCreateNotification,
  ): Promise<INotification> {
    try {
      const notification = await this.notificationRepository.createNotification(
        {
          ...params,
          status: ENotificationStatus.PENDING,
          priority: params.priority ?? notificationConfig.priorities.default,
          scheduledAt: params.scheduledAt ?? new Date(),
        },
      );

      Logger.info('Notification created', {
        notificationId: notification._id,
        patientId: notification.patientId,
        status: notification.status,
      });

      this.notificationSocketGateway?.broadcastNotification({
        type: 'notification.created',
        notification,
      });

      if (this.notificationJobScheduler) {
        await this.notificationJobScheduler.enqueue({
          notificationId: notification._id,
          patientId: notification.patientId,
          metadata: {
            type: params.type ?? ENotificationType.REMINDER,
          },
        });
      } else if (this.notificationProvider) {
        await this.notificationProvider.send({
          to: notification.patientId,
          title: notification.title,
          body: notification.message,
        });
      }

      return notification;
    } catch (error) {
      throw new Error(
        `Error creating notification: ${(error as Error).message}`,
      );
    }
  }

  async processNotification(id: string): Promise<INotification | null> {
    const notification =
      await this.notificationRepository.getNotificationById(id);
    if (!notification) return null;

    await this.notificationRepository.updateNotificationById(id, {
      notificationData: {
        status: ENotificationStatus.PROCESSING,
        attempts: (notification.attempts ?? 0) + 1,
      },
    });

    try {
      if (!this.notificationProvider || !this.patientRepository || !this.userRepository) {
        throw new Error('Notification delivery dependencies are not configured');
      }

      const patient = await this.patientRepository.getPatientById(
        notification.patientId,
      );
      if (!patient) throw new Error(`Patient ${notification.patientId} not found`);
      const user = await this.userRepository.findById(patient.userId);
      const tokens = user?.devices
        ?.filter((device) => device.enabled !== false)
        .map((device) => device.token) ?? [];
      if (tokens.length === 0) {
        throw new Error(`No enabled Expo push token registered for patient ${notification.patientId}`);
      }

      const payloads = tokens.map((token) => ({
        to: token,
        title: notification.title,
        body: notification.message,
        data: {
          notificationId: notification._id,
          patientId: notification.patientId,
          queueItemId: notification.queueItemId,
          appointmentId: notification.appointmentId,
          type: notification.type,
        },
      }));
      const tickets = await this.notificationProvider.sendMany(payloads);
      const ticketIds = tickets.map((ticket) => ticket.id).filter(Boolean);

      const updated = await this.notificationRepository.updateNotificationById(
        id,
        {
          notificationData: {
            status: ENotificationStatus.SENT,
            sentAt: new Date(),
            provider: 'expo',
            deviceToken: tokens[0],
            providerResponse: { tickets, ticketIds },
            lastError: null,
          },
        },
      );

      Logger.info('Push accepted by Expo', {
        notificationId: id,
        patientId: notification.patientId,
        tokens,
        payloads,
        tickets,
        ticketIds,
      });
      await this.notificationJobScheduler?.enqueueReceipt(id);
      this.notificationSocketGateway?.broadcastNotification({
        type: 'notification.delivered',
        notification: updated,
      });
      return updated;
    } catch (error) {
      const message = (error as Error).message;
      const attempts = (notification.attempts ?? 0) + 1;
      await this.notificationRepository.updateNotificationById(id, {
        notificationData: {
          status:
            attempts >= notificationConfig.retry.attempts
              ? ENotificationStatus.FAILED
              : ENotificationStatus.PENDING,
          lastError: message,
          attempts,
        },
      });
      Logger.error('Push failed', {
        notificationId: id,
        error: message,
        attempts,
      });
      throw error;
    }
  }

  async processReceipt(id: string): Promise<INotification | null> {
    const notification = await this.notificationRepository.getNotificationById(id);
    if (!notification || !this.notificationProvider) return notification;
    const ticketIds = Array.isArray(notification.providerResponse?.ticketIds)
      ? notification.providerResponse.ticketIds.filter(
          (ticketId): ticketId is string => typeof ticketId === 'string',
        )
      : [];
    if (ticketIds.length === 0) {
      throw new Error(`Notification ${id} has no Expo ticket IDs to check`);
    }
    const receipts = await this.notificationProvider.getReceipts(ticketIds);
    const errors = receipts.filter((receipt) => receipt.status !== 'ok');
    if (errors.length > 0) {
      throw new Error(`Expo receipt error: ${JSON.stringify(errors)}`);
    }
    const updated = await this.notificationRepository.updateNotificationById(id, {
      notificationData: {
        status: ENotificationStatus.DELIVERED,
        deliveredAt: new Date(),
        providerResponse: { ...notification.providerResponse, receipts },
      },
    });
    Logger.info('Expo delivery confirmed by receipt', {
      notificationId: id,
      ticketIds,
      receiptIds: receipts.map((receipt) => receipt.id),
      receipts,
    });
    return updated;
  }

  async getNotificationById(id: string): Promise<INotification | null> {
    try {
      const notification =
        await this.notificationRepository.getNotificationById(id);
      if (!notification) {
        throw new Error('Notification not found');
      }
      return notification;
    } catch (error) {
      throw new Error(
        `Error retrieving notification by ID: ${(error as Error).message}`,
      );
    }
  }

  async listNotifications(
    filter: Partial<INotification>,
  ): Promise<INotification[]> {
    try {
      return await this.notificationRepository.listNotifications(filter);
    } catch (error) {
      throw new Error(
        `Error listing notifications: ${(error as Error).message}`,
      );
    }
  }

  async updateNotificationById(
    id: string,
    params: IParamsUpdateNotification,
  ): Promise<INotification | null> {
    try {
      const updated = await this.notificationRepository.updateNotificationById(
        id,
        params,
      );
      if (!updated) {
        throw new Error('Notification not found');
      }
      return updated;
    } catch (error) {
      throw new Error(
        `Error updating notification: ${(error as Error).message}`,
      );
    }
  }

  async deleteNotificationById(id: string): Promise<INotification | null> {
    try {
      const deleted =
        await this.notificationRepository.deleteNotificationById(id);
      if (!deleted) {
        throw new Error('Notification not found');
      }
      return deleted;
    } catch (error) {
      throw new Error(
        `Error deleting notification: ${(error as Error).message}`,
      );
    }
  }

  async markNotificationRead(id: string): Promise<INotification | null> {
    try {
      const updated =
        await this.notificationRepository.markNotificationRead(id);
      if (!updated) {
        throw new Error('Notification not found');
      }
      return updated;
    } catch (error) {
      throw new Error(
        `Error marking notification as read: ${(error as Error).message}`,
      );
    }
  }
}
