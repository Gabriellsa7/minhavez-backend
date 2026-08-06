import {
  EQueueItemStatus,
  IQueueItem,
} from '../interfaces/queue-item.interface';
import {
  IParamsCreateQueueItem,
  IParamsUpdateQueueItem,
  IQueueItemRepository,
} from '../repository/queue-item.repository.interface';
import { IQueueItemService } from '../interfaces/queue-item.service.interface';
import { IQueueRepository } from '../../queue/repository/queue.repository.interface';
import { EQueueStatus } from '../../queue/interfaces/queue.interface';
import { IAppointmentRepository } from '../../appointment/repository/appointment.repository.interface';
import { EAppointmentStatus } from '../../appointment/interfaces/appointment.interface';
import { QueueNotificationService } from '../../notification/service/queue-notification.service';
import { INotificationSocketGateway } from '../../notification/interfaces/notification-socket.interface';

export class QueueItemService implements IQueueItemService {
  private queueItemRepository: IQueueItemRepository;
  private queueRepository: IQueueRepository;
  private appointmentRepository: IAppointmentRepository;
  private queueNotificationService?: QueueNotificationService;

  constructor(params: {
    queueItemRepository: IQueueItemRepository;
    queueRepository: IQueueRepository;
    appointmentRepository: IAppointmentRepository;
    queueNotificationService?: QueueNotificationService;
    notificationSocketGateway?: INotificationSocketGateway;
  }) {
    this.queueItemRepository = params.queueItemRepository;
    this.queueRepository = params.queueRepository;
    this.appointmentRepository = params.appointmentRepository;
    this.queueNotificationService = params.queueNotificationService;
    this.notificationSocketGateway = params.notificationSocketGateway;
  }
  private notificationSocketGateway?: INotificationSocketGateway;

  async createQueueItem(params: IParamsCreateQueueItem): Promise<IQueueItem> {
    try {
      return await this.queueItemRepository.createQueueItem(params);
    } catch (error) {
      throw new Error(`Error creating queue item: ${(error as Error).message}`);
    }
  }

  async getQueueItemById(_id: string): Promise<IQueueItem | null> {
    try {
      const queueItem = await this.queueItemRepository.getQueueItemById(_id);
      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      return queueItem;
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemsByPatientId(patientId: string): Promise<IQueueItem[]> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemsByPatientId(patientId);
      return queueItems;
    } catch (error) {
      throw new Error(
        `Error retrieving queue items by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemByProfessionalId(
    professionalId: string,
  ): Promise<IQueueItem[] | null> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemByProfessionalId(
          professionalId,
        );

      return queueItems;
    } catch (error) {
      throw new Error(
        `Error retrieving queue items by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueItemByQueueId(queueId: string): Promise<IQueueItem[] | null> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemByQueueId(queueId);
      if (!queueItems) {
        throw new Error('Queue item not found');
      }

      return queueItems;
    } catch (error) {
      throw new Error(
        `Error retrieving queue item by queue ID: ${(error as Error).message}`,
      );
    }
  }

  async updateQueueItemById(
    _id: string,
    params: IParamsUpdateQueueItem,
  ): Promise<IQueueItem | null> {
    try {
      const updatedQueueItem =
        await this.queueItemRepository.updateQueueItemById(_id, params);

      if (!updatedQueueItem) {
        throw new Error('Queue item not found');
      }

      return updatedQueueItem;
    } catch (error) {
      throw new Error(`Error updating queue item: ${(error as Error).message}`);
    }
  }

  async deleteQueueItemById(_id: string): Promise<IQueueItem | null> {
    try {
      const deletedQueueItem =
        await this.queueItemRepository.deleteQueueItemById(_id);

      if (!deletedQueueItem) {
        throw new Error('Queue item not found');
      }

      return deletedQueueItem;
    } catch (error) {
      throw new Error(`Error deleting queue item: ${(error as Error).message}`);
    }
  }

  private async closeQueueIfEmpty(queueId: string): Promise<void> {
    try {
      const queueItems = await this.queueItemRepository.listQueueItems({
        queueId,
      });

      const hasPendingItems = queueItems.some(
        (item) =>
          item.status === EQueueItemStatus.WAITING ||
          item.status === EQueueItemStatus.IN_SERVICE,
      );

      if (!hasPendingItems) {
        await this.queueRepository.updateQueueById(queueId, {
          status: EQueueStatus.CLOSED,
          closedAt: new Date(),
        });
      }
    } catch (error) {
      throw new Error(
        `Error finishing queue item: ${(error as Error).message}`,
      );
    }
  }

  async finishQueueItem(queueItemId: string): Promise<IQueueItem> {
    try {
      const queueItem =
        await this.queueItemRepository.getQueueItemById(queueItemId);

      if (!queueItem) throw new Error('Queue item not found');

      if (queueItem.status !== EQueueItemStatus.IN_SERVICE)
        throw new Error('Patient is not in service');

      const updated = await this.queueItemRepository.updateQueueItemById(
        queueItemId,
        {
          status: EQueueItemStatus.FINISHED,

          finishedAt: new Date(),
        },
      );

      await this.completeAppointment(queueItemId);

      await this.advanceQueue(queueItem.queueId);
      await this.recalculatePositions(queueItem.queueId);

      return updated!;
    } catch (error) {
      throw new Error(`Error listing queue items: ${(error as Error).message}`);
    }
  }

  async markQueueItemAsAbsent(queueItemId: string): Promise<IQueueItem> {
    try {
      const queueItem =
        await this.queueItemRepository.getQueueItemById(queueItemId);

      if (!queueItem) throw new Error('Queue item not found');

      if (queueItem.status !== EQueueItemStatus.IN_SERVICE)
        throw new Error('Patient is not in service');

      if (queueItem.missedCalls === 0) {
        const lastPosition =
          await this.queueItemRepository.getLastQueuePosition(
            queueItem.queueId,
          );

        const updated = await this.queueItemRepository.updateQueueItemById(
          queueItemId,
          {
            missedCalls: 1,

            position: lastPosition + 1,

            status: EQueueItemStatus.WAITING,

            calledAt: undefined,
          },
        );

        await this.advanceQueue(queueItem.queueId);
        await this.recalculatePositions(queueItem.queueId);

        return updated!;
      }

      const updated = await this.queueItemRepository.updateQueueItemById(
        queueItemId,
        {
          missedCalls: 2,

          status: EQueueItemStatus.ABSENT,

          finishedAt: new Date(),
        },
      );

      await this.advanceQueue(queueItem.queueId);
      await this.recalculatePositions(queueItem.queueId);

      return updated!;
    } catch (error) {
      throw new Error(`Error listing queue items: ${(error as Error).message}`);
    }
  }

  private async advanceQueue(queueId: string): Promise<void> {
    try {
      const next =
        await this.queueItemRepository.getNextWaitingQueueItem(queueId);

      if (next) {
        await this.queueItemRepository.updateQueueItemById(next._id, {
          status: EQueueItemStatus.IN_SERVICE,

          calledAt: new Date(),
        });

        return;
      }

      await this.queueRepository.updateQueueById(queueId, {
        status: EQueueStatus.CLOSED,

        closedAt: new Date(),
      });
    } catch (error) {
      throw new Error(`Error listing queue items: ${(error as Error).message}`);
    }
  }

  async callQueueItem(id: string): Promise<IQueueItem> {
    try {
      const queueItem = await this.queueItemRepository.getQueueItemById(id);

      if (!queueItem) {
        throw new Error('Queue item not found');
      }

      if (queueItem.status !== EQueueItemStatus.WAITING) {
        throw new Error('Only waiting patients can be called');
      }

      const updatedQueueItem =
        await this.queueItemRepository.updateQueueItemById(id, {
          status: EQueueItemStatus.IN_SERVICE,
          calledAt: new Date(),
        });

      if (!updatedQueueItem) {
        throw new Error('Queue item not found');
      }

      await this.queueNotificationService?.handleQueuePositionChange(
        updatedQueueItem,
      );
      await this.recalculatePositions(updatedQueueItem.queueId);

      return updatedQueueItem;
    } catch (error) {
      throw new Error(`Error calling queue item: ${(error as Error).message}`);
    }
  }

  /** Keeps the persisted position equal to the patient's current place, not
   * the immutable order in which they checked in. */
  private async recalculatePositions(queueId: string): Promise<void> {
    const activeItems = (await this.queueItemRepository.listQueueItems({ queueId }))
      .filter(
        (item) =>
          item.status === EQueueItemStatus.WAITING ||
          item.status === EQueueItemStatus.IN_SERVICE,
      )
      .sort((left, right) => left.position - right.position);

    const changed = [] as IQueueItem[];
    for (const [index, item] of activeItems.entries()) {
      const position = index + 1;
      if (item.position !== position) {
        const updated = await this.queueItemRepository.updateQueueItemById(
          item._id,
          { position },
        );
        if (updated) changed.push(updated);
      }
    }

    for (const item of changed) {
      await this.queueNotificationService?.handleQueuePositionChange(item);
    }

    this.notificationSocketGateway?.broadcastNotification({
      type: 'queue.updated',
      queueId,
      changedQueueItemIds: changed.map((item) => item._id),
      connectedAt: new Date().toISOString(),
    });
  }

  private async completeAppointment(queueItemId: string): Promise<void> {
    const appointments = await this.appointmentRepository.listAppointments({
      queueItemId,
    });

    if (appointments.length === 0) {
      return;
    }

    await this.appointmentRepository.updateAppointmentById(
      appointments[0]._id,
      {
        status: EAppointmentStatus.COMPLETED,
        finishedAt: new Date(),
      },
    );
  }

  async listQueueItem(filter: Partial<IQueueItem>): Promise<IQueueItem[]> {
    try {
      return await this.queueItemRepository.listQueueItems(filter);
    } catch (error) {
      throw new Error(`Error listing queue items: ${(error as Error).message}`);
    }
  }
}
