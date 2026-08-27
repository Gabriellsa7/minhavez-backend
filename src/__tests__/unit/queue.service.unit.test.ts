import { QueueService } from '../../domain/queue/service/queue.service';
import {
  EQueueItemStatus,
  EQueueItemPriority,
  IQueueItem,
} from '../../domain/queue-item/interfaces/queue-item.interface';
import { IQueueItemRepository } from '../../domain/queue-item/repository/queue-item.repository.interface';
import { EQueueStatus, IQueue } from '../../domain/queue/interfaces/queue.interface';
import { IQueueRepository } from '../../domain/queue/repository/queue.repository.interface';
import { IAppointmentRepository } from '../../domain/appointment/repository/appointment.repository.interface';
import {
  EAppointmentStatus,
  IAppointment,
} from '../../domain/appointment/interfaces/appointment.interface';
import { INotificationSocketGateway } from '../../domain/notification/interfaces/notification-socket.interface';

function buildQueue(overrides: Partial<IQueue> = {}): IQueue {
  return {
    _id: 'queue-1',
    professionalId: 'professional-1',
    healthUnitId: 'unit-1',
    queueDate: new Date(),
    shift: 'MORNING' as IQueue['shift'],
    status: EQueueStatus.OPEN,
    openedAt: new Date(),
    ...overrides,
  } as IQueue;
}

function buildQueueItem(overrides: Partial<IQueueItem>): IQueueItem {
  return {
    _id: 'qi-1',
    queueId: 'queue-1',
    patientId: 'patient-1',
    code: 'A1',
    position: 1,
    priority: EQueueItemPriority.MEDIUM,
    status: EQueueItemStatus.WAITING,
    missedCalls: 0,
    ...overrides,
  };
}

function buildAppointment(overrides: Partial<IAppointment>): IAppointment {
  return {
    _id: 'appointment-1',
    patientId: 'patient-1',
    professionalId: 'professional-1',
    healthUnitId: 'unit-1',
    queueItemId: 'qi-1',
    dateTime: new Date(),
    status: EAppointmentStatus.SCHEDULED,
    isReturn: false,
    returnScheduled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('QueueService.closeQueue', () => {
  it('marks pending queue items and their appointments as closed and broadcasts the change', async () => {
    const queueItems = [
      buildQueueItem({ _id: 'qi-1', status: EQueueItemStatus.IN_SERVICE }),
      buildQueueItem({ _id: 'qi-2', status: EQueueItemStatus.WAITING, patientId: 'patient-2' }),
      buildQueueItem({ _id: 'qi-3', status: EQueueItemStatus.FINISHED, patientId: 'patient-3' }),
    ];
    const appointments: Record<string, IAppointment> = {
      'qi-1': buildAppointment({ _id: 'appt-1', queueItemId: 'qi-1' }),
      'qi-2': buildAppointment({
        _id: 'appt-2',
        queueItemId: 'qi-2',
        patientId: 'patient-2',
      }),
    };

    const updateQueueItemById = jest.fn(
      async (id: string, params: Partial<IQueueItem>) => {
        const item = queueItems.find((candidate) => candidate._id === id);
        if (!item) return null;
        Object.assign(item, params);
        return { ...item };
      },
    );

    const queueItemRepository = {
      listQueueItems: jest.fn(async () => queueItems.map((item) => ({ ...item }))),
      updateQueueItemById,
    } as unknown as IQueueItemRepository;

    const updateAppointmentById = jest.fn(
      async (id: string, params: Partial<IAppointment>) => {
        const appointment = Object.values(appointments).find(
          (candidate) => candidate._id === id,
        );
        if (!appointment) return null;
        Object.assign(appointment, params);
        return { ...appointment };
      },
    );

    const appointmentRepository = {
      listAppointments: jest.fn(async (filter: Partial<IAppointment>) =>
        filter.queueItemId && appointments[filter.queueItemId]
          ? [appointments[filter.queueItemId]]
          : [],
      ),
      updateAppointmentById,
    } as unknown as IAppointmentRepository;

    const queue = buildQueue();
    const queueRepository = {
      getQueueById: jest.fn(async () => ({ ...queue })),
      updateQueueById: jest.fn(async (_id: string, params: Partial<IQueue>) => {
        Object.assign(queue, params);
        return { ...queue };
      }),
    } as unknown as IQueueRepository;

    const broadcastNotification = jest.fn();
    const notificationSocketGateway = {
      broadcastNotification,
    } as unknown as INotificationSocketGateway;

    const service = new QueueService({
      queueRepository,
      queueItemRepository,
      healthUnitRepository: {} as never,
      healthProfessionalRepository: {} as never,
      appointmentRepository,
      notificationSocketGateway,
    });

    await service.closeQueue('queue-1');

    expect(updateQueueItemById).toHaveBeenCalledWith(
      'qi-1',
      expect.objectContaining({ status: EQueueItemStatus.QUEUE_CLOSED }),
    );
    expect(updateQueueItemById).toHaveBeenCalledWith(
      'qi-2',
      expect.objectContaining({ status: EQueueItemStatus.QUEUE_CLOSED }),
    );
    expect(updateQueueItemById).not.toHaveBeenCalledWith(
      'qi-3',
      expect.anything(),
    );

    expect(updateAppointmentById).toHaveBeenCalledWith(
      'appt-1',
      expect.objectContaining({ status: EAppointmentStatus.QUEUE_CLOSED }),
    );
    expect(updateAppointmentById).toHaveBeenCalledWith(
      'appt-2',
      expect.objectContaining({ status: EAppointmentStatus.QUEUE_CLOSED }),
    );

    expect(broadcastNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'queue.closed',
        queueId: 'queue-1',
        closedQueueItemIds: expect.arrayContaining(['qi-1', 'qi-2']),
      }),
    );
  });

  it('is a no-op when the queue is already closed', async () => {
    const queue = buildQueue({ status: EQueueStatus.CLOSED });
    const queueRepository = {
      getQueueById: jest.fn(async () => ({ ...queue })),
      updateQueueById: jest.fn(),
    } as unknown as IQueueRepository;

    const queueItemRepository = {
      listQueueItems: jest.fn(),
      updateQueueItemById: jest.fn(),
    } as unknown as IQueueItemRepository;

    const appointmentRepository = {
      listAppointments: jest.fn(),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;

    const broadcastNotification = jest.fn();

    const service = new QueueService({
      queueRepository,
      queueItemRepository,
      healthUnitRepository: {} as never,
      healthProfessionalRepository: {} as never,
      appointmentRepository,
      notificationSocketGateway: { broadcastNotification } as unknown as INotificationSocketGateway,
    });

    await service.closeQueue('queue-1');

    expect(queueItemRepository.listQueueItems).not.toHaveBeenCalled();
    expect(broadcastNotification).not.toHaveBeenCalled();
  });
});
