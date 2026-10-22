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
import {
  EAppointmentStatus,
  IAppointment,
} from '../../appointment/interfaces/appointment.interface';
import { QueueNotificationService } from '../../notification/service/queue-notification.service';
import { NotificationService } from '../../notification/service/notification.service';
import { ENotificationType } from '../../notification/interfaces/notification.interface';
import { INotificationSocketGateway } from '../../notification/interfaces/notification-socket.interface';
import { QueueOrderingService } from './queue-ordering.service';
import { isSameBrazilDay } from '../../../shared/utils/brazilTime';
import { Logger } from 'traceability';

const CHECK_IN_TOLERANCE_MINUTES = 5;

const CHECK_IN_REMINDER_MESSAGE =
  'Sua consulta começou. Confirme sua presença na recepção da unidade em até 5 minutos para não perder sua vaga.';

const QUEUE_CALLED_MESSAGE =
  'Você foi chamado para o atendimento. Dirija-se ao consultório.';

const APPOINTMENT_CANCELED_FOR_ABSENCE_MESSAGE =
  'Você não compareceu às duas chamadas para o atendimento, então sua consulta foi cancelada. Se ainda precisar, já pode marcar uma nova consulta.';

const APPOINTMENT_AUTO_CANCELED_MESSAGE =
  'Sua consulta foi cancelada automaticamente porque não identificamos seu check-in em até 5 minutos após o horário marcado.';

export class QueueItemService implements IQueueItemService {
  private queueItemRepository: IQueueItemRepository;
  private queueRepository: IQueueRepository;
  private appointmentRepository: IAppointmentRepository;
  private queueNotificationService?: QueueNotificationService;
  private notificationService?: NotificationService;
  private queueOrderingService: QueueOrderingService;

  constructor(params: {
    queueItemRepository: IQueueItemRepository;
    queueRepository: IQueueRepository;
    appointmentRepository: IAppointmentRepository;
    queueNotificationService?: QueueNotificationService;
    notificationService?: NotificationService;
    notificationSocketGateway?: INotificationSocketGateway;
    queueOrderingService?: QueueOrderingService;
  }) {
    this.queueItemRepository = params.queueItemRepository;
    this.queueRepository = params.queueRepository;
    this.appointmentRepository = params.appointmentRepository;
    this.queueNotificationService = params.queueNotificationService;
    this.notificationService = params.notificationService;
    this.notificationSocketGateway = params.notificationSocketGateway;
    this.queueOrderingService =
      params.queueOrderingService ??
      new QueueOrderingService({
        queueItemRepository: params.queueItemRepository,
        queueNotificationService: params.queueNotificationService,
        notificationSocketGateway: params.notificationSocketGateway,
      });
  }
  private notificationSocketGateway?: INotificationSocketGateway;

  async createQueueItem(params: IParamsCreateQueueItem): Promise<IQueueItem> {
    return await this.queueItemRepository.createQueueItem(params);
  }

  async getQueueItemById(_id: string): Promise<IQueueItem | null> {
    try {
      const queueItem = await this.queueItemRepository.getQueueItemById(_id);
      if (!queueItem) {
        throw new Error('Paciente não encontrado na fila.');
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
        throw new Error('Paciente não encontrado na fila.');
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
    const updatedQueueItem = await this.queueItemRepository.updateQueueItemById(
      _id,
      params,
    );

    if (!updatedQueueItem) {
      throw new Error('Paciente não encontrado na fila.');
    }

    return updatedQueueItem;
  }

  async deleteQueueItemById(_id: string): Promise<IQueueItem | null> {
    const deletedQueueItem =
      await this.queueItemRepository.deleteQueueItemById(_id);

    if (!deletedQueueItem) {
      throw new Error('Paciente não encontrado na fila.');
    }

    return deletedQueueItem;
  }

  async finishQueueItem(queueItemId: string): Promise<IQueueItem> {
    const queueItem =
      await this.queueItemRepository.getQueueItemById(queueItemId);

    if (!queueItem) throw new Error('Paciente não encontrado na fila.');

    if (queueItem.status !== EQueueItemStatus.IN_SERVICE)
      throw new Error('Este paciente não está em atendimento.');

    const [appointment] = await this.appointmentRepository.listAppointments({
      queueItemId,
    });

    if (appointment && !appointment.isReturn && !appointment.returnScheduled) {
      throw new Error(
        'Marque o retorno do paciente antes de concluir o atendimento.',
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
    await this.queueOrderingService.recalculatePositions(queueItem.queueId);

    return updated!;
  }

  async markQueueItemAsAbsent(queueItemId: string): Promise<IQueueItem> {
    const queueItem =
      await this.queueItemRepository.getQueueItemById(queueItemId);

    if (!queueItem) throw new Error('Paciente não encontrado na fila.');

    if (queueItem.status !== EQueueItemStatus.IN_SERVICE)
      throw new Error('Este paciente não está em atendimento.');

    if (queueItem.missedCalls === 0) {
      const lastPosition = await this.queueItemRepository.getLastQueuePosition(
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

      // Renumber before calling the next patient: when the absent patient is the
      // only one waiting, they are called again and must not keep "last + 1".
      await this.queueOrderingService.recalculatePositions(queueItem.queueId);
      await this.advanceQueue(queueItem.queueId);
      await this.queueOrderingService.recalculatePositions(queueItem.queueId);

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

    await this.cancelAppointmentForDefinitiveAbsence(queueItem);

    await this.advanceQueue(queueItem.queueId);
    await this.queueOrderingService.recalculatePositions(queueItem.queueId);

    return updated!;
  }

  async checkInQueueItem(queueItemId: string): Promise<IQueueItem> {
    const queueItem =
      await this.queueItemRepository.getQueueItemById(queueItemId);

    if (!queueItem) throw new Error('Paciente não encontrado na fila.');

    if (queueItem.status !== EQueueItemStatus.WAITING) {
      throw new Error('Somente pacientes aguardando podem fazer check-in.');
    }

    if (queueItem.checkInTime) {
      throw new Error('Check-in já realizado para este paciente.');
    }

    // There is intentionally no earliest check-in time: a patient who arrives early
    // can confirm presence at the front desk whenever they get there.
    const checkInTime = new Date();

    const updated = await this.queueItemRepository.updateQueueItemById(
      queueItemId,
      { checkInTime },
    );

    await this.mirrorCheckInToAppointment(queueItemId, checkInTime);

    this.notificationSocketGateway?.broadcastNotification(
      {
        type: 'queue-item.checked-in',
        queueId: queueItem.queueId,
        queueItemId: queueItem._id,
        patientId: queueItem.patientId,
      },
      { queueId: queueItem.queueId, patientIds: [queueItem.patientId] },
    );

    return updated!;
  }

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

  async markMissedCheckInsAsAbsent(
    now: Date = new Date(),
  ): Promise<IQueueItem[]> {
    const scheduledAppointments =
      await this.appointmentRepository.listAppointments({
        status: EAppointmentStatus.SCHEDULED,
      });

    const eligibleAppointments = scheduledAppointments.filter((appointment) => {
      if (!appointment.queueItemId || appointment.checkInAt) return false;
      return isSameBrazilDay(new Date(appointment.dateTime), now);
    });

    const dueForReminder = eligibleAppointments.filter((appointment) => {
      if (appointment.checkInReminderSentAt) return false;

      const dateTimeMs = new Date(appointment.dateTime).getTime();
      const toleranceCutoff =
        dateTimeMs + CHECK_IN_TOLERANCE_MINUTES * 60 * 1000;

      return now.getTime() >= dateTimeMs && now.getTime() < toleranceCutoff;
    });

    const overdueAppointments = eligibleAppointments.filter((appointment) => {
      const toleranceCutoff =
        new Date(appointment.dateTime).getTime() +
        CHECK_IN_TOLERANCE_MINUTES * 60 * 1000;

      return now.getTime() >= toleranceCutoff;
    });

    for (const appointment of dueForReminder) {
      await this.sendCheckInReminder(appointment, now);
    }

    const marked: IQueueItem[] = [];

    for (const appointment of overdueAppointments) {
      const absentItem = await this.markAbsentForMissedCheckIn(
        appointment.queueItemId!,
      );
      if (absentItem) marked.push(absentItem);
    }

    return marked;
  }

  private async sendCheckInReminder(
    appointment: IAppointment,
    now: Date,
  ): Promise<void> {
    try {
      await this.notificationService?.createNotification({
        patientId: appointment.patientId,
        type: ENotificationType.CHECK_IN_REMINDER,
        title: 'Faça seu check-in',
        message: CHECK_IN_REMINDER_MESSAGE,
        queueItemId: appointment.queueItemId ?? undefined,
        appointmentId: appointment._id,
        data: {
          appointmentId: appointment._id,
          queueItemId: appointment.queueItemId ?? null,
        },
      });

      await this.appointmentRepository.updateAppointmentById(appointment._id, {
        checkInReminderSentAt: now,
      });
    } catch (error) {
      console.error(
        `Error sending check-in reminder for appointment ${appointment._id}:`,
        error,
      );
    }
  }

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

      const queue = await this.queueRepository.getQueueById(queueItem.queueId);
      if (!queue || queue.status === EQueueStatus.CLOSED) {
        Logger.info('Skipped missed-check-in auto-cancel: queue not open', {
          queueItemId,
          queueStatus: queue?.status ?? null,
        });
        return null;
      }

      const updated = await this.queueItemRepository.updateQueueItemById(
        queueItemId,
        {
          status: EQueueItemStatus.ABSENT,
          finishedAt: new Date(),
        },
      );

      await this.queueOrderingService.recalculatePositions(queueItem.queueId);

      const [appointment] = await this.appointmentRepository.listAppointments({
        queueItemId,
      });

      if (appointment) {
        await this.appointmentRepository.updateAppointmentById(
          appointment._id,
          {
            status: EAppointmentStatus.CANCELED,
            finishedAt: new Date(),
          },
        );
      } else {
        Logger.warn(
          'No appointment found for queue item during missed-check-in auto-cancel',
          { queueItemId },
        );
      }

      await this.notificationService?.createNotification({
        patientId: queueItem.patientId,
        type: ENotificationType.APPOINTMENT_AUTO_CANCELED,
        title: 'Consulta cancelada por falta de check-in',
        message: APPOINTMENT_AUTO_CANCELED_MESSAGE,
        queueItemId,
        appointmentId: appointment?._id,
        data: {
          queueId: queueItem.queueId,
          healthUnitId: queue.healthUnitId,
          appointmentId: appointment?._id ?? null,
        },
      });

      Logger.info('Auto-cancelled appointment for missed check-in', {
        queueItemId,
        appointmentId: appointment?._id ?? null,
        appointmentFound: Boolean(appointment),
      });

      return updated;
    } catch (error) {
      console.error(
        `Error marking queue item ${queueItemId} absent for missed check-in:`,
        error,
      );
      return null;
    }
  }

  private async advanceQueue(queueId: string): Promise<void> {
    const next =
      await this.queueItemRepository.getNextWaitingQueueItem(queueId);

    if (next) {
      const called = await this.queueItemRepository.updateQueueItemIfStatus(
        next._id,
        EQueueItemStatus.WAITING,
        { status: EQueueItemStatus.IN_SERVICE, calledAt: new Date() },
      );

      if (called) await this.notifyPatientCalled(called);
    }
  }

  async callQueueItem(id: string): Promise<IQueueItem> {
    const queueItem = await this.queueItemRepository.getQueueItemById(id);

    if (!queueItem) {
      throw new Error('Paciente não encontrado na fila.');
    }

    // The status check and the transition happen in one atomic update, so a double
    // click or two concurrent requests produce a single call.
    const updatedQueueItem =
      await this.queueItemRepository.updateQueueItemIfStatus(
        id,
        EQueueItemStatus.WAITING,
        { status: EQueueItemStatus.IN_SERVICE, calledAt: new Date() },
      );

    if (!updatedQueueItem) {
      throw new Error(
        'Só é possível chamar pacientes que estão aguardando. Este paciente já foi chamado ou saiu da fila.',
      );
    }

    await this.notifyPatientCalled(updatedQueueItem);
    await this.queueNotificationService?.handleQueuePositionChange(
      updatedQueueItem,
    );
    await this.queueOrderingService.recalculatePositions(
      updatedQueueItem.queueId,
    );

    return updatedQueueItem;
  }

  private async notifyPatientCalled(queueItem: IQueueItem): Promise<void> {
    this.notificationSocketGateway?.broadcastNotification(
      {
        type: 'queue-item.called',
        queueId: queueItem.queueId,
        queueItemId: queueItem._id,
        patientId: queueItem.patientId,
      },
      { queueId: queueItem.queueId, patientIds: [queueItem.patientId] },
    );

    try {
      await this.notificationService?.createNotification({
        patientId: queueItem.patientId,
        type: ENotificationType.QUEUE_CALLED,
        title: 'É a sua vez!',
        message: QUEUE_CALLED_MESSAGE,
        queueItemId: queueItem._id,
        data: { queueId: queueItem.queueId, queueItemId: queueItem._id },
      });
    } catch (error) {
      console.error(
        `Error notifying patient called for queue item ${queueItem._id}:`,
        error,
      );
    }
  }

  private async cancelAppointmentForDefinitiveAbsence(
    queueItem: IQueueItem,
  ): Promise<void> {
    const [appointment] = await this.appointmentRepository.listAppointments({
      queueItemId: queueItem._id,
    });

    if (appointment) {
      await this.appointmentRepository.updateAppointmentById(appointment._id, {
        status: EAppointmentStatus.CANCELED,
        finishedAt: new Date(),
      });
    }

    try {
      const queue = await this.queueRepository.getQueueById(queueItem.queueId);

      await this.notificationService?.createNotification({
        patientId: queueItem.patientId,
        type: ENotificationType.APPOINTMENT_CANCELED_FOR_ABSENCE,
        title: 'Consulta cancelada por ausência',
        message: APPOINTMENT_CANCELED_FOR_ABSENCE_MESSAGE,
        queueItemId: queueItem._id,
        appointmentId: appointment?._id,
        data: {
          queueId: queueItem.queueId,
          healthUnitId: queue?.healthUnitId ?? null,
          appointmentId: appointment?._id ?? null,
        },
      });
    } catch (error) {
      console.error(
        `Error notifying definitive absence for queue item ${queueItem._id}:`,
        error,
      );
    }
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
    return await this.queueItemRepository.listQueueItems(filter);
  }
}
