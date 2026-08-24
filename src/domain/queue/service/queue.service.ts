import {
  EQueueShift,
  EQueueStatus,
  IHealthUnitQueueSummary,
  IQueue,
} from '../interfaces/queue.interface';
import {
  IQueueService,
  IQueueWithDetails,
} from '../interfaces/queue.service.interface';
import {
  IParamsCreateQueue,
  IParamsUpdateQueue,
  IQueueRepository,
} from '../repository/queue.repository.interface';
import {
  EQueueItemStatus,
  IQueueItem,
} from '../../queue-item/interfaces/queue-item.interface';
import { IQueueItemRepository } from '../../queue-item/repository/queue-item.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IHealthProfessionalRepository } from '../../health-professional.ts/repository/health-professional.repository.interface';
import { IQueueManagement } from '../interfaces/queue-management.interface';
import {
  IQueueHistoryEntry,
  IQueueHistoryFilter,
} from '../interfaces/queue-history.interface';
import { AppError } from '../../../shared/errors/AppError';
import { pickNextWaitingQueueItem } from '../../queue-item/utils/pick-next-queue-item';

const AFTERNOON_SHIFT_START_HOUR = 12;
const AFTERNOON_SHIFT_START_MINUTE = 30;
const AFTERNOON_SHIFT_START_LABEL = '12:30';

export class QueueService implements IQueueService {
  private queueRepository: IQueueRepository;
  private queueItemRepository: IQueueItemRepository;
  private healthUnitRepository: IHealthUnitRepository;
  private healthProfessionalRepository: IHealthProfessionalRepository;

  constructor(params: {
    queueRepository: IQueueRepository;
    queueItemRepository: IQueueItemRepository;
    healthUnitRepository: IHealthUnitRepository;
    healthProfessionalRepository: IHealthProfessionalRepository;
  }) {
    this.queueRepository = params.queueRepository;
    this.queueItemRepository = params.queueItemRepository;
    this.healthUnitRepository = params.healthUnitRepository;
    this.healthProfessionalRepository = params.healthProfessionalRepository;
  }

  private async getEstimatedWaitMinutes(
    queue: IQueue,
    patientItem: IQueueItem | undefined,
  ): Promise<number | null> {
    if (!patientItem) return null;

    if (patientItem.status === EQueueItemStatus.IN_SERVICE) return 0;

    if (
      patientItem.status !== EQueueItemStatus.WAITING ||
      patientItem.position <= 0
    ) {
      return null;
    }

    const professional =
      await this.healthProfessionalRepository.getHealthProfessionalById(
        queue.professionalId,
      );
    const appointmentDuration = professional?.schedule?.appointmentDuration;

    if (!appointmentDuration) return null;

    return (patientItem.position - 1) * appointmentDuration;
  }

  private hasShiftStarted(shift: EQueueShift, now: Date): boolean {
    if (shift === EQueueShift.MORNING) return true;

    const afternoonStart = new Date(now);
    afternoonStart.setHours(
      AFTERNOON_SHIFT_START_HOUR,
      AFTERNOON_SHIFT_START_MINUTE,
      0,
      0,
    );

    return now.getTime() >= afternoonStart.getTime();
  }

  async createQueue(params: IParamsCreateQueue): Promise<IQueue> {
    try {
      if (params.status === EQueueStatus.OPEN) {
        const existingOpenQueues = await this.queueRepository.listQueues({
          professionalId: params.professionalId,
          status: EQueueStatus.OPEN,
        });

        const alreadyHasQueueForShift = existingOpenQueues.some((queue) => {
          return (
            queue.queueDate.getFullYear() === params.queueDate?.getFullYear() &&
            queue.queueDate.getMonth() === params.queueDate?.getMonth() &&
            queue.queueDate.getDate() === params.queueDate?.getDate() &&
            queue.shift === params.shift
          );
        });

        if (alreadyHasQueueForShift) {
          throw new Error('Already has an open queue for this day');
        }
      }
      return await this.queueRepository.createQueue(params);
    } catch (error) {
      throw new Error(`Error creating queue: ${(error as Error).message}`);
    }
  }

  async getQueueById(id: string): Promise<IQueue | null> {
    try {
      const queue = await this.queueRepository.getQueueById(id);

      if (!queue) {
        throw new Error('Queue not found');
      }

      return queue;
    } catch (error) {
      throw new Error(
        `Error retrieving queue by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueuesByPatientId(patientId: string): Promise<IQueue[]> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemsByPatientId(patientId);
      const queueIds = [...new Set(queueItems.map((item) => item.queueId))];
      const queues = await Promise.all(
        queueIds.map((id) => this.queueRepository.getQueueById(id)),
      );
      return queues.filter((queue) => queue !== null) as IQueue[];
    } catch (error) {
      throw new Error(
        `Error retrieving queues by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueuesWithDetailsByPatientId(
    patientId: string,
  ): Promise<IQueueWithDetails[]> {
    try {
      const queueItems =
        await this.queueItemRepository.getQueueItemsByPatientId(patientId);
      const queueIds = [...new Set(queueItems.map((item) => item.queueId))];

      const queuesWithDetails = await Promise.all(
        queueIds.map(async (queueId) => {
          const queue = await this.queueRepository.getQueueById(queueId);
          if (!queue) return null;

          const healthUnit = await this.healthUnitRepository.getHealthUnitById(
            queue.healthUnitId,
          );
          const queueItemsInQueue =
            await this.queueItemRepository.listQueueItems({ queueId });

          const patientItem = queueItems.find(
            (queueItem) => queueItem.queueId === queueId,
          );

          const estimatedWaitMinutes = await this.getEstimatedWaitMinutes(
            queue,
            patientItem,
          );

          return {
            ...queue,
            healthUnitName: healthUnit?.name || 'Unknown',
            queueSize: queueItemsInQueue.length,
            patientCode: patientItem?.code,
            estimatedWaitMinutes,
          };
        }),
      );

      return queuesWithDetails.filter((q) => q !== null) as IQueueWithDetails[];
    } catch (error) {
      throw new Error(
        `Error retrieving queues with details by patient ID: ${(error as Error).message}`,
      );
    }
  }

  async updateQueueById(
    _id: string,
    params: IParamsUpdateQueue,
  ): Promise<IQueue | null> {
    try {
      const updatedQueue = await this.queueRepository.updateQueueById(
        _id,
        params,
      );

      if (!updatedQueue) {
        throw new Error('Queue not found');
      }

      return updatedQueue;
    } catch (error) {
      throw new Error(`Error updating queue: ${(error as Error).message}`);
    }
  }

  async deleteQueueById(id: string): Promise<IQueue | null> {
    try {
      const deletedQueue = await this.queueRepository.deleteQueueById(id);

      if (!deletedQueue) {
        throw new Error('Queue not found');
      }

      return deletedQueue;
    } catch (error) {
      throw new Error(`Error deleting queue: ${(error as Error).message}`);
    }
  }

  async getQueueByProfessionalId(
    professionalId: string,
  ): Promise<IQueue | null> {
    try {
      const queue =
        await this.queueRepository.getQueueByProfessionalId(professionalId);

      if (!queue) {
        throw new Error('Queue not found');
      }

      return queue;
    } catch (error) {
      throw new Error(
        `Error retrieving queue by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueManagementByProfessionalId(
    professionalId: string,
  ): Promise<IQueueManagement | null> {
    try {
      const queueManagement =
        await this.queueRepository.getQueueManagementByProfessionalId(
          professionalId,
        );

      if (!queueManagement) {
        throw new AppError(404, 'Queue not found');
      }

      const nextItem = await pickNextWaitingQueueItem(
        queueManagement.queue._id,
        this.queueItemRepository,
      );

      return { ...queueManagement, nextQueueItemId: nextItem?._id ?? null };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new Error(
        `Error retrieving queue management: ${(error as Error).message}`,
      );
    }
  }

  async openQueue(queueId: string): Promise<IQueue> {
    try {
      const queue = await this.queueRepository.getQueueById(queueId);

      if (!queue) {
        throw new Error('Queue not found');
      }

      if (queue.status === EQueueStatus.OPEN) {
        throw new Error('Queue is already open');
      }

      const openedQueue =
        await this.queueRepository.findOpenQueueByProfessionalIdAndShift(
          queue.professionalId,
          queue.shift,
        );

      if (openedQueue) {
        throw new Error('Professional already has an open queue');
      }

      const today = new Date();

      const isToday =
        queue.queueDate.getFullYear() === today.getFullYear() &&
        queue.queueDate.getMonth() === today.getMonth() &&
        queue.queueDate.getDate() === today.getDate();

      if (!isToday) {
        throw new Error('Only today queue can be opened');
      }

      if (!this.hasShiftStarted(queue.shift, today)) {
        throw new Error(
          `Queue can only be opened after ${AFTERNOON_SHIFT_START_LABEL}`,
        );
      }

      const updatedQueue = await this.queueRepository.updateQueueById(queueId, {
        status: EQueueStatus.OPEN,
        openedAt: new Date(),
        closedAt: null,
      });

      if (!updatedQueue) {
        throw new Error('Queue not found');
      }

      return updatedQueue;
    } catch (error) {
      throw new Error(`Error opening queue: ${(error as Error).message}`);
    }
  }

  async closeQueue(queueId: string): Promise<IQueue> {
    try {
      const queue = await this.queueRepository.getQueueById(queueId);

      if (!queue) {
        throw new Error('Queue not found');
      }

      if (queue.status === EQueueStatus.CLOSED) {
        return queue;
      }

      const updatedQueue = await this.queueRepository.updateQueueById(queueId, {
        status: EQueueStatus.CLOSED,
        closedAt: new Date(),
      });

      if (!updatedQueue) {
        throw new Error('Queue not found');
      }

      return updatedQueue;
    } catch (error) {
      throw new Error(`Error closing queue: ${(error as Error).message}`);
    }
  }

  async getQueuesByProfessionalId(professionalId: string): Promise<IQueue[]> {
    try {
      return await this.queueRepository.getQueuesByProfessionalId(
        professionalId,
      );
    } catch (error) {
      throw new Error(
        `Error retrieving queues by professional ID: ${(error as Error).message}`,
      );
    }
  }

  async listQueues(filter: Partial<IQueue>): Promise<IQueue[]> {
    try {
      return await this.queueRepository.listQueues(filter);
    } catch (error) {
      throw new Error(`Error listing queues: ${(error as Error).message}`);
    }
  }

  async getQueueHistoryByProfessionalId(
    professionalId: string,
    filter?: IQueueHistoryFilter,
  ): Promise<IQueueHistoryEntry[]> {
    try {
      return await this.queueRepository.getQueueHistoryByProfessionalId(
        professionalId,
        filter,
      );
    } catch (error) {
      throw new Error(
        `Error retrieving queue history: ${(error as Error).message}`,
      );
    }
  }

  async getHealthUnitQueueSummary(
    healthUnitId: string,
  ): Promise<IHealthUnitQueueSummary> {
    try {
      return await this.queueRepository.getHealthUnitQueueSummary(
        healthUnitId,
      );
    } catch (error) {
      throw new Error(
        `Error retrieving health unit queue summary: ${(error as Error).message}`,
      );
    }
  }
}
