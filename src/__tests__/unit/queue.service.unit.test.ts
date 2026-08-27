import { QueueService } from '../../domain/queue/service/queue.service';
import {
  EQueueItemStatus,
  EQueueItemPriority,
  IQueueItem,
} from '../../domain/queue-item/interfaces/queue-item.interface';
import { IQueueItemRepository } from '../../domain/queue-item/repository/queue-item.repository.interface';
import { EQueueShift, EQueueStatus, IQueue } from '../../domain/queue/interfaces/queue.interface';
import { IQueueRepository } from '../../domain/queue/repository/queue.repository.interface';
import { IAppointmentRepository } from '../../domain/appointment/repository/appointment.repository.interface';
import {
  EAppointmentStatus,
  IAppointment,
} from '../../domain/appointment/interfaces/appointment.interface';
import { INotificationSocketGateway } from '../../domain/notification/interfaces/notification-socket.interface';
import { INotificationService } from '../../domain/notification/interfaces/notification.service.interface';
import { ENotificationType } from '../../domain/notification/interfaces/notification.interface';

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

    const createNotification = jest.fn(async () => ({}) as never);
    const notificationService = {
      createNotification,
    } as unknown as INotificationService;

    const service = new QueueService({
      queueRepository,
      queueItemRepository,
      healthUnitRepository: {} as never,
      healthProfessionalRepository: {} as never,
      appointmentRepository,
      notificationSocketGateway,
      notificationService,
    });

    await service.closeQueue('queue-1', 'Emergência médica');

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
        reason: 'Emergência médica',
      }),
    );

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'patient-1',
        type: ENotificationType.QUEUE_CLOSED,
        message: 'Emergência médica',
        queueItemId: 'qi-1',
        data: expect.objectContaining({ healthUnitId: 'unit-1' }),
      }),
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'patient-2',
        type: ENotificationType.QUEUE_CLOSED,
        message: 'Emergência médica',
        queueItemId: 'qi-2',
        data: expect.objectContaining({ healthUnitId: 'unit-1' }),
      }),
    );
    expect(createNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ patientId: 'patient-3' }),
    );
  });

  it('falls back to a default message when no reason is provided', async () => {
    const queueItems = [
      buildQueueItem({ _id: 'qi-1', status: EQueueItemStatus.WAITING }),
    ];

    const queueItemRepository = {
      listQueueItems: jest.fn(async () => queueItems.map((item) => ({ ...item }))),
      updateQueueItemById: jest.fn(async () => queueItems[0]),
    } as unknown as IQueueItemRepository;

    const appointmentRepository = {
      listAppointments: jest.fn(async () => []),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;

    const queue = buildQueue();
    const queueRepository = {
      getQueueById: jest.fn(async () => ({ ...queue })),
      updateQueueById: jest.fn(async (_id: string, params: Partial<IQueue>) => {
        Object.assign(queue, params);
        return { ...queue };
      }),
    } as unknown as IQueueRepository;

    const createNotification = jest.fn(async () => ({}) as never);
    const notificationService = {
      createNotification,
    } as unknown as INotificationService;

    const service = new QueueService({
      queueRepository,
      queueItemRepository,
      healthUnitRepository: {} as never,
      healthProfessionalRepository: {} as never,
      appointmentRepository,
      notificationService,
    });

    await service.closeQueue('queue-1');

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'O profissional encerrou a fila.' }),
    );
  });

  it('is a no-op when the queue already went through a full open→close cycle', async () => {
    const queue = buildQueue({ status: EQueueStatus.CLOSED, openedAt: new Date() });
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

  it('cancels a pending queue that was never opened (e.g. a future appointment day) and cascades to its patients', async () => {
    // Booking a future appointment creates the queue already CLOSED (see
    // AppointmentService.createAppointment), with WAITING queue items for
    // whoever booked ahead of time. Canceling it in advance must still
    // cascade — unlike a queue that already completed its open→close cycle.
    const queueItems = [
      buildQueueItem({ _id: 'qi-1', status: EQueueItemStatus.WAITING }),
    ];
    const appointments: Record<string, IAppointment> = {
      'qi-1': buildAppointment({ _id: 'appt-1', queueItemId: 'qi-1' }),
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

    const queue = buildQueue({ status: EQueueStatus.CLOSED, openedAt: undefined });
    const queueRepository = {
      getQueueById: jest.fn(async () => ({ ...queue })),
      updateQueueById: jest.fn(async (_id: string, params: Partial<IQueue>) => {
        Object.assign(queue, params);
        return { ...queue };
      }),
    } as unknown as IQueueRepository;

    const broadcastNotification = jest.fn();
    const createNotification = jest.fn(async () => ({}) as never);

    const service = new QueueService({
      queueRepository,
      queueItemRepository,
      healthUnitRepository: {} as never,
      healthProfessionalRepository: {} as never,
      appointmentRepository,
      notificationSocketGateway: { broadcastNotification } as unknown as INotificationSocketGateway,
      notificationService: { createNotification } as unknown as INotificationService,
    });

    await service.closeQueue('queue-1', 'Médico indisponível nesse dia');

    expect(updateQueueItemById).toHaveBeenCalledWith(
      'qi-1',
      expect.objectContaining({ status: EQueueItemStatus.QUEUE_CLOSED }),
    );
    expect(updateAppointmentById).toHaveBeenCalledWith(
      'appt-1',
      expect.objectContaining({ status: EAppointmentStatus.QUEUE_CLOSED }),
    );
    expect(broadcastNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'queue.closed', queueId: 'queue-1' }),
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 'patient-1',
        type: ENotificationType.QUEUE_CLOSED,
        data: expect.objectContaining({ healthUnitId: 'unit-1' }),
      }),
    );
  });
});

describe('QueueService.autoCloseQueuesForShift', () => {
  it('closes every OPEN queue for the given shift, leaving other shifts and already-closed queues untouched', async () => {
    const morningOpenQueue = buildQueue({
      _id: 'queue-morning-open',
      shift: 'MORNING' as IQueue['shift'],
      status: EQueueStatus.OPEN,
    });
    const morningClosedQueue = buildQueue({
      _id: 'queue-morning-closed',
      shift: 'MORNING' as IQueue['shift'],
      status: EQueueStatus.CLOSED,
    });
    const afternoonOpenQueue = buildQueue({
      _id: 'queue-afternoon-open',
      shift: 'AFTERNOON' as IQueue['shift'],
      status: EQueueStatus.OPEN,
    });

    const queues: Record<string, IQueue> = {
      [morningOpenQueue._id]: morningOpenQueue,
      [morningClosedQueue._id]: morningClosedQueue,
      [afternoonOpenQueue._id]: afternoonOpenQueue,
    };

    const listQueues = jest.fn(async (filter: Partial<IQueue>) =>
      Object.values(queues)
        .filter(
          (queue) =>
            (!filter.shift || queue.shift === filter.shift) &&
            (!filter.status || queue.status === filter.status),
        )
        .map((queue) => ({ ...queue })),
    );

    const updateQueueById = jest.fn(
      async (id: string, params: Partial<IQueue>) => {
        Object.assign(queues[id], params);
        return { ...queues[id] };
      },
    );

    const queueRepository = {
      listQueues,
      getQueueById: jest.fn(async (id: string) => ({ ...queues[id] })),
      updateQueueById,
    } as unknown as IQueueRepository;

    const queueItemRepository = {
      listQueueItems: jest.fn(async () => []),
      updateQueueItemById: jest.fn(),
    } as unknown as IQueueItemRepository;

    const appointmentRepository = {
      listAppointments: jest.fn(async () => []),
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

    await service.autoCloseQueuesForShift(EQueueShift.MORNING);

    expect(listQueues).toHaveBeenCalledWith({
      shift: EQueueShift.MORNING,
      status: EQueueStatus.OPEN,
    });

    expect(updateQueueById).toHaveBeenCalledWith(
      'queue-morning-open',
      expect.objectContaining({ status: EQueueStatus.CLOSED }),
    );
    expect(updateQueueById).not.toHaveBeenCalledWith(
      'queue-afternoon-open',
      expect.anything(),
    );

    expect(broadcastNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'queue.closed',
        queueId: 'queue-morning-open',
        reason: 'Fila encerrada automaticamente pelo horário de expediente.',
      }),
    );
    expect(broadcastNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ queueId: 'queue-afternoon-open' }),
    );
  });
});
