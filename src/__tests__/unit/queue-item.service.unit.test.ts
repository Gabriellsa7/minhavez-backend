import { QueueItemService } from '../../domain/queue-item/service/queue-item.service';
import {
  EQueueItemStatus,
  EQueueItemPriority,
  IQueueItem,
} from '../../domain/queue-item/interfaces/queue-item.interface';
import { IQueueItemRepository } from '../../domain/queue-item/repository/queue-item.repository.interface';
import { IQueueRepository } from '../../domain/queue/repository/queue.repository.interface';
import { EQueueStatus, IQueue } from '../../domain/queue/interfaces/queue.interface';
import { IAppointmentRepository } from '../../domain/appointment/repository/appointment.repository.interface';
import {
  EAppointmentStatus,
  IAppointment,
} from '../../domain/appointment/interfaces/appointment.interface';
import { QueueNotificationService } from '../../domain/notification/service/queue-notification.service';
import { IPrescriptionRepository } from '../../domain/prescription/repository/prescription.repository.interface';

function createFakePrescriptionRepository(hasPrescription = true) {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByPatientId: jest.fn(),
    findByProfessionalId: jest.fn(),
    existsForQueueItemId: jest.fn().mockResolvedValue(hasPrescription),
  } as unknown as IPrescriptionRepository;
}

function createFakeQueueItemRepository(initialItems: IQueueItem[]) {
  const items = initialItems.map((item) => ({ ...item }));

  return {
    listQueueItems: jest.fn(async (filter: Partial<IQueueItem>) =>
      items
        .filter((item) => !filter.queueId || item.queueId === filter.queueId)
        .map((item) => ({ ...item })),
    ),
    getQueueItemById: jest.fn(async (id: string) => {
      const item = items.find((candidate) => candidate._id === id);
      return item ? { ...item } : null;
    }),
    updateQueueItemById: jest.fn(async (id: string, params: Partial<IQueueItem>) => {
      const item = items.find((candidate) => candidate._id === id);
      if (!item) return null;
      Object.assign(item, params);
      return { ...item };
    }),
    getNextWaitingQueueItem: jest.fn(async (queueId: string) => {
      const waiting = items
        .filter(
          (item) =>
            item.queueId === queueId && item.status === EQueueItemStatus.WAITING,
        )
        .sort((left, right) => left.position - right.position);
      return waiting[0] ? { ...waiting[0] } : null;
    }),
    getLastCalledQueueItem: jest.fn(async (queueId: string) => {
      const called = items
        .filter((item) => item.queueId === queueId && item.calledAt)
        .sort(
          (left, right) =>
            (right.calledAt as Date).getTime() -
            (left.calledAt as Date).getTime(),
        );
      return called[0] ? { ...called[0] } : null;
    }),
    getNextWaitingQueueItemByPriorityGroup: jest.fn(
      async (queueId: string, isPriority: boolean) => {
        const waiting = items
          .filter(
            (item) =>
              item.queueId === queueId &&
              item.status === EQueueItemStatus.WAITING &&
              (isPriority
                ? item.priority === EQueueItemPriority.HIGH
                : item.priority !== EQueueItemPriority.HIGH),
          )
          .sort((left, right) => left.position - right.position);
        return waiting[0] ? { ...waiting[0] } : null;
      },
    ),
    getLastQueuePosition: jest.fn(async () => items.length),
    createQueueItem: jest.fn(),
    deleteQueueItemById: jest.fn(),
    getQueueItemsByPatientId: jest.fn(),
    getQueueItemByQueueId: jest.fn(),
    getQueueItemByProfessionalId: jest.fn(),
  } as unknown as IQueueItemRepository;
}

describe('QueueItemService position notifications', () => {
  it('notifies patients behind as soon as the doctor calls the person ahead of them, not only when they finish', async () => {
    const queueItems: IQueueItem[] = [
      {
        _id: 'qi-1',
        queueId: 'queue-1',
        patientId: 'patient-1',
        code: 'A1',
        position: 1,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
        missedCalls: 0,
      },
      {
        _id: 'qi-2',
        queueId: 'queue-1',
        patientId: 'patient-2',
        code: 'A2',
        position: 2,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
        missedCalls: 0,
      },
      {
        _id: 'qi-3',
        queueId: 'queue-1',
        patientId: 'patient-3',
        code: 'A3',
        position: 3,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
        missedCalls: 0,
      },
    ];

    const queueItemRepository = createFakeQueueItemRepository(queueItems);
    const queueRepository = {
      updateQueueById: jest.fn(),
    } as unknown as IQueueRepository;
    const appointmentRepository = {
      listAppointments: jest.fn().mockResolvedValue([]),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;

    const handleQueuePositionChange = jest.fn().mockResolvedValue(null);
    const queueNotificationService = {
      handleQueuePositionChange,
    } as unknown as QueueNotificationService;

    const service = new QueueItemService({
      queueItemRepository,
      queueRepository,
      appointmentRepository,
      prescriptionRepository: createFakePrescriptionRepository(),
      queueNotificationService,
    });

    // Doctor calls the first patient: patient-3 (last in line) should move
    // from position 3 to position 2 right away and be notified.
    await service.callQueueItem('qi-1');

    expect(handleQueuePositionChange).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'qi-3', patientId: 'patient-3', position: 2 }),
    );

    handleQueuePositionChange.mockClear();

    // Doctor finishes the first patient: patient-3 should now move to
    // position 1 and be notified again.
    await service.finishQueueItem('qi-1');

    expect(handleQueuePositionChange).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'qi-3', patientId: 'patient-3', position: 1 }),
    );
  });
});

describe('QueueItemService finishQueueItem return-scheduling guard', () => {
  function buildQueueItem(): IQueueItem {
    return {
      _id: 'qi-1',
      queueId: 'queue-1',
      patientId: 'patient-1',
      code: 'A1',
      position: 1,
      priority: EQueueItemPriority.MEDIUM,
      status: EQueueItemStatus.IN_SERVICE,
      missedCalls: 0,
    };
  }

  function buildService(
    appointment: IAppointment | undefined,
    hasPrescription = true,
  ) {
    const queueItemRepository = createFakeQueueItemRepository([
      buildQueueItem(),
    ]);
    const queueRepository = {
      updateQueueById: jest.fn(),
    } as unknown as IQueueRepository;
    const appointmentRepository = {
      listAppointments: jest
        .fn()
        .mockResolvedValue(appointment ? [appointment] : []),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;
    const prescriptionRepository = createFakePrescriptionRepository(hasPrescription);

    const service = new QueueItemService({
      queueItemRepository,
      queueRepository,
      appointmentRepository,
      prescriptionRepository,
    });

    return { service, appointmentRepository, queueRepository, prescriptionRepository };
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

  it('blocks finishing a normal appointment that has no return scheduled yet', async () => {
    const { service } = buildService(
      buildAppointment({ isReturn: false, returnScheduled: false }),
    );

    await expect(service.finishQueueItem('qi-1')).rejects.toThrow(
      'Marque o retorno do paciente antes de concluir o atendimento.',
    );
  });

  it('allows finishing once a return has been scheduled for the appointment', async () => {
    const { service } = buildService(
      buildAppointment({ isReturn: false, returnScheduled: true }),
    );

    await expect(
      service.finishQueueItem('qi-1'),
    ).resolves.toMatchObject({ status: EQueueItemStatus.FINISHED });
  });

  it('allows finishing a return appointment without requiring another return', async () => {
    const { service } = buildService(
      buildAppointment({ isReturn: true, returnScheduled: false }),
    );

    await expect(
      service.finishQueueItem('qi-1'),
    ).resolves.toMatchObject({ status: EQueueItemStatus.FINISHED });
  });

  it('allows finishing a queue item with no backing appointment (walk-in)', async () => {
    const { service } = buildService(undefined);

    await expect(
      service.finishQueueItem('qi-1'),
    ).resolves.toMatchObject({ status: EQueueItemStatus.FINISHED });
  });

  it('does not close the queue when finishing the last waiting patient — only a manual or scheduled close should', async () => {
    const { service, queueRepository } = buildService(undefined);

    await service.finishQueueItem('qi-1');

    expect(queueRepository.updateQueueById).not.toHaveBeenCalled();
  });
});

describe('QueueItemService finishQueueItem prescription guard', () => {
  function buildQueueItem(): IQueueItem {
    return {
      _id: 'qi-1',
      queueId: 'queue-1',
      patientId: 'patient-1',
      code: 'A1',
      position: 1,
      priority: EQueueItemPriority.MEDIUM,
      status: EQueueItemStatus.IN_SERVICE,
      missedCalls: 0,
    };
  }

  function buildService(hasPrescription: boolean) {
    const queueItemRepository = createFakeQueueItemRepository([
      buildQueueItem(),
    ]);
    const queueRepository = {
      updateQueueById: jest.fn(),
    } as unknown as IQueueRepository;
    const appointmentRepository = {
      listAppointments: jest.fn().mockResolvedValue([]),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;
    const prescriptionRepository = createFakePrescriptionRepository(hasPrescription);

    const service = new QueueItemService({
      queueItemRepository,
      queueRepository,
      appointmentRepository,
      prescriptionRepository,
    });

    return { service, prescriptionRepository };
  }

  it('blocks finishing when no prescription was registered for this attendance', async () => {
    const { service } = buildService(false);

    await expect(service.finishQueueItem('qi-1')).rejects.toThrow(
      'Registre uma receita antes de concluir o atendimento.',
    );
  });

  it('allows finishing once a prescription has been registered for this attendance', async () => {
    const { service, prescriptionRepository } = buildService(true);

    await expect(
      service.finishQueueItem('qi-1'),
    ).resolves.toMatchObject({ status: EQueueItemStatus.FINISHED });

    expect(prescriptionRepository.existsForQueueItemId).toHaveBeenCalledWith(
      'qi-1',
    );
  });
});

describe('QueueItemService checkInQueueItem', () => {
  function buildQueueItem(overrides: Partial<IQueueItem> = {}): IQueueItem {
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

  function buildAppointment(overrides: Partial<IAppointment> = {}): IAppointment {
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

  function buildService(
    queueItem: IQueueItem,
    appointment?: IAppointment,
  ) {
    const queueItemRepository = createFakeQueueItemRepository([queueItem]);
    const queueRepository = {
      updateQueueById: jest.fn(),
    } as unknown as IQueueRepository;
    const appointmentRepository = {
      listAppointments: jest
        .fn()
        .mockResolvedValue(appointment ? [appointment] : []),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;

    const service = new QueueItemService({
      queueItemRepository,
      queueRepository,
      appointmentRepository,
      prescriptionRepository: createFakePrescriptionRepository(),
    });

    return { service, queueItemRepository, appointmentRepository };
  }

  it('records the check-in time and mirrors it onto the linked appointment', async () => {
    const { service, queueItemRepository, appointmentRepository } =
      buildService(buildQueueItem(), buildAppointment());

    const result = await service.checkInQueueItem('qi-1');

    expect(result.checkInTime).toBeInstanceOf(Date);
    expect(queueItemRepository.updateQueueItemById).toHaveBeenCalledWith(
      'qi-1',
      { checkInTime: expect.any(Date) },
    );
    expect(appointmentRepository.updateAppointmentById).toHaveBeenCalledWith(
      'appointment-1',
      { checkInAt: expect.any(Date) },
    );
  });

  it('allows check-in for a walk-in queue item with no backing appointment', async () => {
    const { service, appointmentRepository } = buildService(buildQueueItem());

    await expect(service.checkInQueueItem('qi-1')).resolves.toMatchObject({
      checkInTime: expect.any(Date),
    });
    expect(appointmentRepository.updateAppointmentById).not.toHaveBeenCalled();
  });

  it('rejects check-in for a patient who is already being attended', async () => {
    const { service } = buildService(
      buildQueueItem({ status: EQueueItemStatus.IN_SERVICE }),
    );

    await expect(service.checkInQueueItem('qi-1')).rejects.toThrow(
      'Somente pacientes aguardando podem fazer check-in',
    );
  });

  it('rejects a duplicate check-in', async () => {
    const { service } = buildService(
      buildQueueItem({ checkInTime: new Date() }),
    );

    await expect(service.checkInQueueItem('qi-1')).rejects.toThrow(
      'Check-in já realizado para este paciente',
    );
  });
});

describe('QueueItemService markMissedCheckInsAsAbsent', () => {
  function buildQueueItem(overrides: Partial<IQueueItem> = {}): IQueueItem {
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

  function buildAppointment(overrides: Partial<IAppointment> = {}): IAppointment {
    return {
      _id: 'appointment-1',
      patientId: 'patient-1',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      queueItemId: 'qi-1',
      dateTime: new Date('2026-01-05T09:00:00-03:00'),
      status: EAppointmentStatus.SCHEDULED,
      isReturn: false,
      returnScheduled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  function buildQueue(overrides: Partial<IQueue> = {}): IQueue {
    return {
      _id: 'queue-1',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      queueDate: new Date('2026-01-05T09:00:00-03:00'),
      shift: 'MORNING' as IQueue['shift'],
      status: EQueueStatus.OPEN,
      openedAt: new Date('2026-01-05T08:00:00-03:00'),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as IQueue;
  }

  function buildService(
    queueItem: IQueueItem,
    appointments: IAppointment[],
    queue: IQueue | null = buildQueue(),
  ) {
    const queueItemRepository = createFakeQueueItemRepository([queueItem]);
    const queueRepository = {
      getQueueById: jest.fn().mockResolvedValue(queue),
      updateQueueById: jest.fn(),
    } as unknown as IQueueRepository;
    const appointmentRepository = {
      listAppointments: jest.fn().mockResolvedValue(appointments),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;

    const service = new QueueItemService({
      queueItemRepository,
      queueRepository,
      appointmentRepository,
      prescriptionRepository: createFakePrescriptionRepository(),
    });

    return { service, queueItemRepository, queueRepository };
  }

  const now = new Date('2026-01-05T09:06:00-03:00');

  it('marks a queue item absent once the 5-minute check-in tolerance has passed', async () => {
    const { service, queueItemRepository } = buildService(
      buildQueueItem(),
      [buildAppointment()],
    );

    const marked = await service.markMissedCheckInsAsAbsent(now);

    expect(marked).toHaveLength(1);
    expect(queueItemRepository.updateQueueItemById).toHaveBeenCalledWith(
      'qi-1',
      expect.objectContaining({ status: EQueueItemStatus.ABSENT }),
    );
  });

  it('does not mark a patient absent while still inside the tolerance window', async () => {
    const withinTolerance = new Date('2026-01-05T09:04:00-03:00');
    const { service, queueItemRepository } = buildService(
      buildQueueItem(),
      [buildAppointment()],
    );

    const marked = await service.markMissedCheckInsAsAbsent(withinTolerance);

    expect(marked).toHaveLength(0);
    expect(queueItemRepository.updateQueueItemById).not.toHaveBeenCalled();
  });

  it('does not touch a patient who already checked in', async () => {
    const { service, queueItemRepository } = buildService(
      buildQueueItem({ checkInTime: new Date() }),
      [buildAppointment({ checkInAt: new Date() })],
    );

    const marked = await service.markMissedCheckInsAsAbsent(now);

    expect(marked).toHaveLength(0);
    expect(queueItemRepository.updateQueueItemById).not.toHaveBeenCalled();
  });

  it('ignores appointments scheduled for a different day', async () => {
    const { service, queueItemRepository } = buildService(
      buildQueueItem(),
      [
        buildAppointment({
          dateTime: new Date('2026-01-04T09:00:00-03:00'),
        }),
      ],
    );

    const marked = await service.markMissedCheckInsAsAbsent(now);

    expect(marked).toHaveLength(0);
    expect(queueItemRepository.updateQueueItemById).not.toHaveBeenCalled();
  });

  it('does not mark a patient absent when the queue was never opened by the professional', async () => {
    // Nothing to check into yet — that's QueueService.autoCancelUnopenedQueues'
    // job, which cancels the whole queue and tells the patient why instead of
    // silently blaming them for not checking in.
    const { service, queueItemRepository } = buildService(
      buildQueueItem(),
      [buildAppointment()],
      buildQueue({ status: EQueueStatus.CLOSED, openedAt: undefined }),
    );

    const marked = await service.markMissedCheckInsAsAbsent(now);

    expect(marked).toHaveLength(0);
    expect(queueItemRepository.updateQueueItemById).not.toHaveBeenCalled();
  });

  it('does not mark a patient absent when the queue has already been closed', async () => {
    const { service, queueItemRepository } = buildService(
      buildQueueItem(),
      [buildAppointment()],
      buildQueue({ status: EQueueStatus.CLOSED, closedAt: new Date() }),
    );

    const marked = await service.markMissedCheckInsAsAbsent(now);

    expect(marked).toHaveLength(0);
    expect(queueItemRepository.updateQueueItemById).not.toHaveBeenCalled();
  });

  it('marks a patient absent once the queue is actually open and running', async () => {
    const { service, queueItemRepository, queueRepository } = buildService(
      buildQueueItem(),
      [buildAppointment()],
      buildQueue({ status: EQueueStatus.IN_PROGRESS }),
    );

    const marked = await service.markMissedCheckInsAsAbsent(now);

    expect(queueRepository.getQueueById).toHaveBeenCalledWith('queue-1');
    expect(marked).toHaveLength(1);
    expect(queueItemRepository.updateQueueItemById).toHaveBeenCalledWith(
      'qi-1',
      expect.objectContaining({ status: EQueueItemStatus.ABSENT }),
    );
  });
});
