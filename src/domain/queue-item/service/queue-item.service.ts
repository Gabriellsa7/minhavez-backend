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
import { IAppointmentRepository } from '../../appointment/repository/appointment.repository.interface';
import { EAppointmentStatus } from '../../appointment/interfaces/appointment.interface';
import { IPrescriptionRepository } from '../../prescription/repository/prescription.repository.interface';
import { QueueNotificationService } from '../../notification/service/queue-notification.service';
import { INotificationSocketGateway } from '../../notification/interfaces/notification-socket.interface';
import { pickNextWaitingQueueItem } from '../utils/pick-next-queue-item';
import { isSameBrazilDay } from '../../../shared/utils/brazilTime';

const CHECK_IN_TOLERANCE_MINUTES = 5;

export class QueueItemService implements IQueueItemService {
  private queueItemRepository: IQueueItemRepository;
  private queueRepository: IQueueRepository;
  private appointmentRepository: IAppointmentRepository;
  private prescriptionRepository: IPrescriptionRepository;
  private queueNotificationService?: QueueNotificationService;

  constructor(params: {
    queueItemRepository: IQueueItemRepository;
    queueRepository: IQueueRepository;
    appointmentRepository: IAppointmentRepository;
    prescriptionRepository: IPrescriptionRepository;
    queueNotificationService?: QueueNotificationService;
    notificationSocketGateway?: INotificationSocketGateway;
  }) {
    this.queueItemRepository = params.queueItemRepository;
    this.queueRepository = params.queueRepository;
    this.appointmentRepository = params.appointmentRepository;
    this.prescriptionRepository = params.prescriptionRepository;
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

  async finishQueueItem(queueItemId: string): Promise<IQueueItem> {
    const queueItem =
      await this.queueItemRepository.getQueueItemById(queueItemId);

    if (!queueItem) throw new Error('Queue item not found');

    if (queueItem.status !== EQueueItemStatus.IN_SERVICE)
      throw new Error('Patient is not in service');

    const [appointment] = await this.appointmentRepository.listAppointments({
      queueItemId,
    });

    if (appointment && !appointment.isReturn && !appointment.returnScheduled) {
      throw new Error(
        'Marque o retorno do paciente antes de concluir o atendimento.',
      );
    }

    const hasPrescription =
      await this.prescriptionRepository.existsForQueueItemId(queueItemId);

    if (!hasPrescription) {
      throw new Error(
        'Registre uma receita antes de concluir o atendimento.',
      );
    }

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

  /** Confirms the patient is physically present at the unit, ahead of being
   * called. This is independent from `calledAt`/`finishedAt`: those mark the
   * moment the professional attends the patient, while check-in is the
   * front-desk gate that feeds the late-tolerance/absence rule below. */
  async checkInQueueItem(queueItemId: string): Promise<IQueueItem> {
    const queueItem =
      await this.queueItemRepository.getQueueItemById(queueItemId);

    if (!queueItem) throw new Error('Queue item not found');

    if (queueItem.status !== EQueueItemStatus.WAITING) {
      throw new Error('Somente pacientes aguardando podem fazer check-in');
    }

    if (queueItem.checkInTime) {
      throw new Error('Check-in já realizado para este paciente');
    }

    const checkInTime = new Date();

    const updated = await this.queueItemRepository.updateQueueItemById(
      queueItemId,
      { checkInTime },
    );

    await this.mirrorCheckInToAppointment(queueItemId, checkInTime);

    // Lets the patient's queue screen and the professional's live queue
    // panel pick up the check-in without a manual refresh — both already
    // invalidate their queue queries on any broadcast (see
    // NotificationService.subscribeToSocket / QueueSocketService).
    this.notificationSocketGateway?.broadcastNotification({
      type: 'queue-item.checked-in',
      queueId: queueItem.queueId,
      queueItemId: queueItem._id,
      patientId: queueItem.patientId,
    });

    return updated!;
  }

  /** Keeps Appointment.checkInAt as a denormalized copy of the check-in
   * recorded on the queue item, so the appointment keeps its own arrival
   * record even if the queue item is later deleted (e.g. cancellation). */
  private async mirrorCheckInToAppointment(
    queueItemId: string,
    checkInTime: Date,
  ): Promise<void> {
    const [appointment] = await this.appointmentRepository.listAppointments({
      queueItemId,
    });

    if (!appointment) return;

    await this.appointmentRepository.updateAppointmentById(appointment._id, {
      checkInAt: checkInTime,
    });
  }

  /** Sweeps today's scheduled appointments and marks as ABSENT any queue
   * item whose patient never checked in within the unit's late-tolerance
   * window. Run periodically by a scheduled worker — see
   * CheckInAutoAbsenceWorker. */
  async markMissedCheckInsAsAbsent(now: Date = new Date()): Promise<IQueueItem[]> {
    const scheduledAppointments = await this.appointmentRepository.listAppointments({
      status: EAppointmentStatus.SCHEDULED,
    });

    const overdueAppointments = scheduledAppointments.filter((appointment) => {
      if (!appointment.queueItemId || appointment.checkInAt) return false;
      if (!isSameBrazilDay(new Date(appointment.dateTime), now)) return false;

      const toleranceCutoff =
        new Date(appointment.dateTime).getTime() +
        CHECK_IN_TOLERANCE_MINUTES * 60 * 1000;

      return now.getTime() >= toleranceCutoff;
    });

    const marked: IQueueItem[] = [];

    for (const appointment of overdueAppointments) {
      const absentItem = await this.markAbsentForMissedCheckIn(
        appointment.queueItemId!,
      );
      if (absentItem) marked.push(absentItem);
    }

    return marked;
  }

  /** Best-effort per item: one stale/already-handled queue item shouldn't
   * abort the sweep for the rest of the day's appointments. */
  private async markAbsentForMissedCheckIn(
    queueItemId: string,
  ): Promise<IQueueItem | null> {
    try {
      const queueItem =
        await this.queueItemRepository.getQueueItemById(queueItemId);

      if (!queueItem || queueItem.status !== EQueueItemStatus.WAITING) {
        return null;
      }

      if (queueItem.checkInTime) return null;

      const updated = await this.queueItemRepository.updateQueueItemById(
        queueItemId,
        {
          status: EQueueItemStatus.ABSENT,
          finishedAt: new Date(),
        },
      );

      await this.recalculatePositions(queueItem.queueId);

      return updated;
    } catch (error) {
      console.error(
        `Error marking queue item ${queueItemId} absent for missed check-in:`,
        error,
      );
      return null;
    }
  }

  /** Attending the last waiting patient no longer closes the queue — it
   * stays OPEN so a professional who doesn't press "Fechar fila" keeps
   * receiving walk-in bookings until the scheduled auto-close or a manual
   * close (see QueueService.autoCloseQueuesForShift / closeQueue). */
  private async advanceQueue(queueId: string): Promise<void> {
    try {
      const next = await pickNextWaitingQueueItem(
        queueId,
        this.queueItemRepository,
      );

      if (next) {
        await this.queueItemRepository.updateQueueItemById(next._id, {
          status: EQueueItemStatus.IN_SERVICE,

          calledAt: new Date(),
        });
      }
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

  /** Keeps the persisted position equal to the patient's current place in
   * the waiting line, not the immutable order in which they checked in.
   * Being called into service takes a patient out of the line entirely —
   * they must not keep occupying a slot that blocks everyone behind them
   * from advancing (and being notified) until they're finished. */
  private async recalculatePositions(queueId: string): Promise<void> {
    const waitingItems = (await this.queueItemRepository.listQueueItems({ queueId }))
      .filter((item) => item.status === EQueueItemStatus.WAITING)
      .sort((left, right) => left.position - right.position);

    const changed = [] as IQueueItem[];
    for (const [index, item] of waitingItems.entries()) {
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
