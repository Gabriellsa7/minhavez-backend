import { AppointmentService } from '../../domain/appointment/service/appointment.service';
import {
  EAppointmentStatus,
  IAppointment,
} from '../../domain/appointment/interfaces/appointment.interface';
import {
  IAppointmentRepository,
  IParamsCreateAppointment,
} from '../../domain/appointment/repository/appointment.repository.interface';
import {
  EQueueShift,
  EQueueStatus,
} from '../../domain/queue/interfaces/queue.interface';
import { IQueueRepository } from '../../domain/queue/repository/queue.repository.interface';
import {
  EQueueItemPriority,
  EQueueItemStatus,
} from '../../domain/queue-item/interfaces/queue-item.interface';
import { IQueueItemRepository } from '../../domain/queue-item/repository/queue-item.repository.interface';
import { IHealthProfessionalRepository } from '../../domain/health-professional.ts/repository/health-professional.repository.interface';
import { QueueNotificationService } from '../../domain/notification/service/queue-notification.service';
import { IPatientRepository } from '../../domain/patient/repository/patient.repository.interface';
import { EPatientPriority } from '../../domain/patient/interfaces/patient.interface';

describe('AppointmentService', () => {
  it('should allow creating an appointment when the only matching booking is completed', async () => {
    const existingAppointment: IAppointment = {
      _id: 'existing-id',
      patientId: 'patient-1',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      queueItemId: null,
      dateTime: new Date('2026-07-06T12:00:00.000Z'),
      status: EAppointmentStatus.COMPLETED,
      notes: 'old appointment',
      isReturn: false,
      returnScheduled: false,
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-01T10:00:00.000Z'),
    };

    const createAppointmentMock = jest.fn().mockResolvedValue({
      _id: 'new-id',
      patientId: 'patient-2',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      queueItemId: null,
      dateTime: new Date('2026-07-06T13:00:00.000Z'),
      status: EAppointmentStatus.SCHEDULED,
      notes: 'new appointment',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const repository = {
      listAppointments: jest.fn().mockResolvedValue([existingAppointment]),
      createAppointment: createAppointmentMock,
    } as unknown as IAppointmentRepository;

    const queueRepository = {
      listQueues: jest.fn().mockResolvedValue([
        {
          _id: 'queue-1',
          professionalId: 'professional-1',
          healthUnitId: 'unit-1',
          status: EQueueStatus.OPEN,
          shift: EQueueShift.MORNING,
          queueDate: new Date('2026-07-06T00:00:00.000Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      createQueue: jest.fn().mockResolvedValue({
        _id: 'queue-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        status: EQueueStatus.OPEN,
        shift: EQueueShift.MORNING,
        queueDate: new Date('2026-07-06T00:00:00.000Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as IQueueRepository;

    const queueItemRepository = {
      listQueueItems: jest.fn().mockResolvedValue([]),
      createQueueItem: jest.fn().mockResolvedValue({
        _id: 'queue-item-1',
        queueId: 'queue-1',
        patientId: 'patient-2',
        code: 'ABC123',
        position: 1,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
      }),
    } as unknown as IQueueItemRepository;

    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        schedule: { appointmentDuration: 30 },
      }),
    } as unknown as IHealthProfessionalRepository;

    const service = new AppointmentService({
      appointmentRepository: repository,
      queueRepository,
      queueItemRepository,
      professionalRepository,
    });

    const params: IParamsCreateAppointment = {
      patientId: 'patient-2',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      dateTime: new Date('2026-07-06T13:00:00.000Z'),
      notes: 'new appointment',
    };

    await expect(service.createAppointment(params)).resolves.toMatchObject({
      _id: 'new-id',
      status: EAppointmentStatus.SCHEDULED,
    });
    expect(createAppointmentMock).toHaveBeenCalledWith({
      ...params,
      queueItemId: 'queue-item-1',
    });
  });

  it('creates the queue item with HIGH priority for a non-NORMAL patient, so it joins the AP line', async () => {
    const repository = {
      listAppointments: jest.fn().mockResolvedValue([]),
      createAppointment: jest.fn().mockResolvedValue({
        _id: 'new-id',
        patientId: 'patient-3',
        status: EAppointmentStatus.SCHEDULED,
      }),
    } as unknown as IAppointmentRepository;

    const queueRepository = {
      listQueues: jest.fn().mockResolvedValue([]),
      createQueue: jest.fn().mockResolvedValue({
        _id: 'queue-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        status: EQueueStatus.OPEN,
        shift: EQueueShift.MORNING,
        queueDate: new Date(),
      }),
    } as unknown as IQueueRepository;

    const createQueueItemMock = jest.fn().mockResolvedValue({
      _id: 'queue-item-3',
      queueId: 'queue-1',
      patientId: 'patient-3',
      position: 1,
      priority: EQueueItemPriority.HIGH,
      status: EQueueItemStatus.WAITING,
    });

    const queueItemRepository = {
      listQueueItems: jest.fn().mockResolvedValue([]),
      createQueueItem: createQueueItemMock,
    } as unknown as IQueueItemRepository;

    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        schedule: { appointmentDuration: 30 },
      }),
    } as unknown as IHealthProfessionalRepository;

    const patientRepository = {
      getPatientById: jest
        .fn()
        .mockResolvedValue({ _id: 'patient-3', priority: EPatientPriority.ELDERLY }),
    } as unknown as IPatientRepository;

    const service = new AppointmentService({
      appointmentRepository: repository,
      queueRepository,
      queueItemRepository,
      professionalRepository,
      patientRepository,
    });

    await service.createAppointment({
      patientId: 'patient-3',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      dateTime: new Date(),
    });

    expect(createQueueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ priority: EQueueItemPriority.HIGH }),
    );
  });

  it('creates the queue item with MEDIUM priority for a NORMAL patient, so it joins the AN line', async () => {
    const repository = {
      listAppointments: jest.fn().mockResolvedValue([]),
      createAppointment: jest.fn().mockResolvedValue({
        _id: 'new-id',
        patientId: 'patient-4',
        status: EAppointmentStatus.SCHEDULED,
      }),
    } as unknown as IAppointmentRepository;

    const queueRepository = {
      listQueues: jest.fn().mockResolvedValue([]),
      createQueue: jest.fn().mockResolvedValue({
        _id: 'queue-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        status: EQueueStatus.OPEN,
        shift: EQueueShift.MORNING,
        queueDate: new Date(),
      }),
    } as unknown as IQueueRepository;

    const createQueueItemMock = jest.fn().mockResolvedValue({
      _id: 'queue-item-4',
      queueId: 'queue-1',
      patientId: 'patient-4',
      position: 1,
      priority: EQueueItemPriority.MEDIUM,
      status: EQueueItemStatus.WAITING,
    });

    const queueItemRepository = {
      listQueueItems: jest.fn().mockResolvedValue([]),
      createQueueItem: createQueueItemMock,
    } as unknown as IQueueItemRepository;

    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        schedule: { appointmentDuration: 30 },
      }),
    } as unknown as IHealthProfessionalRepository;

    const patientRepository = {
      getPatientById: jest
        .fn()
        .mockResolvedValue({ _id: 'patient-4', priority: EPatientPriority.NORMAL }),
    } as unknown as IPatientRepository;

    const service = new AppointmentService({
      appointmentRepository: repository,
      queueRepository,
      queueItemRepository,
      professionalRepository,
      patientRepository,
    });

    await service.createAppointment({
      patientId: 'patient-4',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      dateTime: new Date(),
    });

    expect(createQueueItemMock).toHaveBeenCalledWith(
      expect.objectContaining({ priority: EQueueItemPriority.MEDIUM }),
    );
  });

  it('notifies the patient when a brand-new queue item lands exactly on a position threshold', async () => {
    const repository = {
      listAppointments: jest.fn().mockResolvedValue([]),
      createAppointment: jest.fn().mockResolvedValue({
        _id: 'new-id',
        patientId: 'patient-10',
        status: EAppointmentStatus.SCHEDULED,
      }),
    } as unknown as IAppointmentRepository;

    const queueRepository = {
      listQueues: jest.fn().mockResolvedValue([]),
      createQueue: jest.fn().mockResolvedValue({
        _id: 'queue-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        status: EQueueStatus.OPEN,
        shift: EQueueShift.MORNING,
        queueDate: new Date(),
      }),
    } as unknown as IQueueRepository;

    const newQueueItem = {
      _id: 'queue-item-10',
      queueId: 'queue-1',
      patientId: 'patient-10',
      position: 10,
      priority: EQueueItemPriority.MEDIUM,
      status: EQueueItemStatus.WAITING,
    };

    const queueItemRepository = {
      // 9 patients already waiting, so the new one lands exactly on position 10
      listQueueItems: jest.fn().mockResolvedValue(new Array(9).fill({})),
      createQueueItem: jest.fn().mockResolvedValue(newQueueItem),
    } as unknown as IQueueItemRepository;

    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        schedule: { appointmentDuration: 30 },
      }),
    } as unknown as IHealthProfessionalRepository;

    const handleQueuePositionChange = jest.fn().mockResolvedValue(null);
    const queueNotificationService = {
      handleQueuePositionChange,
    } as unknown as QueueNotificationService;

    const service = new AppointmentService({
      appointmentRepository: repository,
      queueRepository,
      queueItemRepository,
      professionalRepository,
      queueNotificationService,
    });

    await service.createAppointment({
      patientId: 'patient-10',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      dateTime: new Date(),
    });

    expect(handleQueuePositionChange).toHaveBeenCalledWith(newQueueItem);
  });

  it('does not fire a position notification when the patient already had a queue item', async () => {
    const existingQueueItem = {
      _id: 'queue-item-1',
      queueId: 'queue-1',
      patientId: 'patient-1',
      position: 5,
      priority: EQueueItemPriority.MEDIUM,
      status: EQueueItemStatus.WAITING,
    };

    const repository = {
      listAppointments: jest.fn().mockResolvedValue([]),
      createAppointment: jest.fn().mockResolvedValue({
        _id: 'new-id',
        patientId: 'patient-1',
        status: EAppointmentStatus.SCHEDULED,
      }),
    } as unknown as IAppointmentRepository;

    const queueRepository = {
      listQueues: jest.fn().mockResolvedValue([]),
      createQueue: jest.fn().mockResolvedValue({
        _id: 'queue-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        status: EQueueStatus.OPEN,
        shift: EQueueShift.MORNING,
        queueDate: new Date(),
      }),
    } as unknown as IQueueRepository;

    const queueItemRepository = {
      listQueueItems: jest.fn().mockResolvedValue([existingQueueItem]),
      createQueueItem: jest.fn(),
    } as unknown as IQueueItemRepository;

    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        schedule: { appointmentDuration: 30 },
      }),
    } as unknown as IHealthProfessionalRepository;

    const handleQueuePositionChange = jest.fn().mockResolvedValue(null);
    const queueNotificationService = {
      handleQueuePositionChange,
    } as unknown as QueueNotificationService;

    const service = new AppointmentService({
      appointmentRepository: repository,
      queueRepository,
      queueItemRepository,
      professionalRepository,
      queueNotificationService,
    });

    await service.createAppointment({
      patientId: 'patient-1',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      dateTime: new Date(),
    });

    expect(handleQueuePositionChange).not.toHaveBeenCalled();
  });

  it('marks the origin appointment as return-scheduled when creating a return via originQueueItemId', async () => {
    const originAppointment: IAppointment = {
      _id: 'origin-appointment-id',
      patientId: 'patient-1',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      queueItemId: 'origin-queue-item-id',
      dateTime: new Date('2026-07-06T12:00:00.000Z'),
      status: EAppointmentStatus.IN_PROGRESS,
      isReturn: false,
      returnScheduled: false,
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-01T10:00:00.000Z'),
    };

    const updateAppointmentByIdMock = jest.fn().mockResolvedValue({
      ...originAppointment,
      returnScheduled: true,
    });

    const repository = {
      listAppointments: jest.fn().mockResolvedValue([originAppointment]),
      createAppointment: jest.fn().mockResolvedValue({
        _id: 'new-return-id',
        patientId: 'patient-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        queueItemId: 'new-queue-item-id',
        dateTime: new Date('2026-07-13T13:00:00.000Z'),
        status: EAppointmentStatus.SCHEDULED,
        isReturn: true,
        returnScheduled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateAppointmentById: updateAppointmentByIdMock,
    } as unknown as IAppointmentRepository;

    const queueRepository = {
      listQueues: jest.fn().mockResolvedValue([]),
      createQueue: jest.fn().mockResolvedValue({
        _id: 'queue-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        status: EQueueStatus.OPEN,
        shift: EQueueShift.MORNING,
        queueDate: new Date('2026-07-13T00:00:00.000Z'),
      }),
    } as unknown as IQueueRepository;

    const queueItemRepository = {
      listQueueItems: jest.fn().mockResolvedValue([]),
      createQueueItem: jest.fn().mockResolvedValue({
        _id: 'new-queue-item-id',
        queueId: 'queue-1',
        patientId: 'patient-1',
        code: 'RET001',
        position: 1,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
      }),
    } as unknown as IQueueItemRepository;

    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        schedule: { appointmentDuration: 30 },
      }),
    } as unknown as IHealthProfessionalRepository;

    const service = new AppointmentService({
      appointmentRepository: repository,
      queueRepository,
      queueItemRepository,
      professionalRepository,
    });

    await service.createAppointment({
      patientId: 'patient-1',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      dateTime: new Date('2026-07-13T13:00:00.000Z'),
      isReturn: true,
      originQueueItemId: 'origin-queue-item-id',
    });

    expect(updateAppointmentByIdMock).toHaveBeenCalledWith(
      'origin-appointment-id',
      { returnScheduled: true },
    );
  });

  it('does not fail the return creation when marking the origin appointment fails', async () => {
    const repository = {
      // The professionalId lookup (booking-conflict check) must keep working;
      // only the queueItemId lookup used to find the origin appointment fails.
      listAppointments: jest.fn().mockImplementation((filter) =>
        filter.queueItemId
          ? Promise.reject(new Error('db down'))
          : Promise.resolve([]),
      ),
      createAppointment: jest.fn().mockResolvedValue({
        _id: 'new-return-id',
        patientId: 'patient-1',
        status: EAppointmentStatus.SCHEDULED,
        isReturn: true,
      }),
      updateAppointmentById: jest.fn(),
    } as unknown as IAppointmentRepository;

    const queueRepository = {
      listQueues: jest.fn().mockResolvedValue([]),
      createQueue: jest.fn().mockResolvedValue({
        _id: 'queue-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        status: EQueueStatus.OPEN,
        shift: EQueueShift.MORNING,
        queueDate: new Date('2026-07-13T00:00:00.000Z'),
      }),
    } as unknown as IQueueRepository;

    const queueItemRepository = {
      listQueueItems: jest.fn().mockResolvedValue([]),
      createQueueItem: jest.fn().mockResolvedValue({
        _id: 'new-queue-item-id',
        queueId: 'queue-1',
        patientId: 'patient-1',
        code: 'RET002',
        position: 1,
        priority: EQueueItemPriority.MEDIUM,
        status: EQueueItemStatus.WAITING,
      }),
    } as unknown as IQueueItemRepository;

    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        schedule: { appointmentDuration: 30 },
      }),
    } as unknown as IHealthProfessionalRepository;

    const service = new AppointmentService({
      appointmentRepository: repository,
      queueRepository,
      queueItemRepository,
      professionalRepository,
    });

    await expect(
      service.createAppointment({
        patientId: 'patient-1',
        professionalId: 'professional-1',
        healthUnitId: 'unit-1',
        dateTime: new Date('2026-07-13T13:00:00.000Z'),
        isReturn: true,
        originQueueItemId: 'origin-queue-item-id',
      }),
    ).resolves.toMatchObject({ _id: 'new-return-id' });
  });

  describe('cancelAppointment', () => {
    const scheduledAppointment: IAppointment = {
      _id: 'appointment-1',
      patientId: 'patient-1',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      queueItemId: 'queue-item-1',
      dateTime: new Date('2026-07-10T13:00:00.000Z'),
      status: EAppointmentStatus.SCHEDULED,
      isReturn: false,
      returnScheduled: false,
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      updatedAt: new Date('2026-06-01T10:00:00.000Z'),
    };

    const buildService = (
      appointment: IAppointment | null = scheduledAppointment,
      overrides?: {
        queueItemRepository?: Partial<IQueueItemRepository>;
        queueRepository?: Partial<IQueueRepository>;
      },
    ) => {
      const getAppointmentByIdMock = jest.fn().mockResolvedValue(appointment);
      const updateAppointmentByIdMock = jest.fn().mockResolvedValue({
        ...appointment,
        status: EAppointmentStatus.CANCELED,
      });

      const repository = {
        getAppointmentById: getAppointmentByIdMock,
        updateAppointmentById: updateAppointmentByIdMock,
      } as unknown as IAppointmentRepository;

      const patientRepository = {
        getPatientByUserId: jest.fn().mockResolvedValue({
          _id: 'patient-1',
          userId: 'user-1',
        }),
      } as unknown as IPatientRepository;

      const queueItemRepository = {
        getQueueItemById: jest.fn().mockResolvedValue(null),
        deleteQueueItemById: jest.fn().mockResolvedValue(null),
        listQueueItems: jest.fn().mockResolvedValue([]),
        updateQueueItemById: jest.fn().mockResolvedValue(null),
        ...overrides?.queueItemRepository,
      } as unknown as IQueueItemRepository;

      const queueRepository = {
        deleteQueueById: jest.fn().mockResolvedValue(null),
        ...overrides?.queueRepository,
      } as unknown as IQueueRepository;

      const service = new AppointmentService({
        appointmentRepository: repository,
        queueRepository,
        queueItemRepository,
        professionalRepository: {} as IHealthProfessionalRepository,
        patientRepository,
      });

      return {
        service,
        getAppointmentByIdMock,
        updateAppointmentByIdMock,
        patientRepository,
        queueItemRepository,
        queueRepository,
      };
    };

    afterEach(() => {
      jest.useRealTimers();
    });

    it('cancels a scheduled appointment when requested before noon of the day before', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-09T11:59:00.000Z'));
      const { service, updateAppointmentByIdMock } = buildService();

      const result = await service.cancelAppointment('appointment-1', {
        sub: 'user-1',
        isAdmin: false,
      });

      expect(result.status).toBe(EAppointmentStatus.CANCELED);
      expect(updateAppointmentByIdMock).toHaveBeenCalledWith('appointment-1', {
        status: EAppointmentStatus.CANCELED,
      });
    });

    it('rejects cancellation at or after noon of the day before the appointment', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-09T12:00:00.000Z'));
      const { service } = buildService();

      await expect(
        service.cancelAppointment('appointment-1', {
          sub: 'user-1',
          isAdmin: false,
        }),
      ).rejects.toMatchObject({
        status: 400,
      });
    });

    it('rejects cancellation from a patient who does not own the appointment', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-09T11:00:00.000Z'));
      const { service, patientRepository } = buildService();
      (patientRepository.getPatientByUserId as jest.Mock).mockResolvedValue({
        _id: 'someone-else',
        userId: 'user-2',
      });

      await expect(
        service.cancelAppointment('appointment-1', {
          sub: 'user-2',
          isAdmin: false,
        }),
      ).rejects.toMatchObject({ status: 403 });
    });

    it('rejects cancellation when the appointment is no longer scheduled', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-09T11:00:00.000Z'));
      const { service } = buildService({
        ...scheduledAppointment,
        status: EAppointmentStatus.COMPLETED,
      });

      await expect(
        service.cancelAppointment('appointment-1', {
          sub: 'user-1',
          isAdmin: false,
        }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('throws 404 when the appointment does not exist', async () => {
      const { service } = buildService(null);

      await expect(
        service.cancelAppointment('missing-id', {
          sub: 'user-1',
          isAdmin: false,
        }),
      ).rejects.toMatchObject({ status: 404 });
    });

    it('deletes the queue item and the queue itself when it was the only item waiting', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-09T11:00:00.000Z'));
      const { service, queueItemRepository, queueRepository } = buildService(
        undefined,
        {
          queueItemRepository: {
            getQueueItemById: jest.fn().mockResolvedValue({
              _id: 'queue-item-1',
              queueId: 'queue-1',
              status: EQueueItemStatus.WAITING,
              position: 1,
            }),
            listQueueItems: jest.fn().mockResolvedValue([]),
          },
        },
      );

      await service.cancelAppointment('appointment-1', {
        sub: 'user-1',
        isAdmin: false,
      });

      expect(queueItemRepository.deleteQueueItemById).toHaveBeenCalledWith(
        'queue-item-1',
      );
      expect(queueRepository.deleteQueueById).toHaveBeenCalledWith('queue-1');
    });

    it('keeps the queue and reindexes the remaining waiting items when others remain', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-09T11:00:00.000Z'));
      const remainingItems = [
        { _id: 'queue-item-2', queueId: 'queue-1', status: EQueueItemStatus.WAITING, position: 2 },
        { _id: 'queue-item-3', queueId: 'queue-1', status: EQueueItemStatus.WAITING, position: 3 },
      ];

      const { service, queueItemRepository, queueRepository } = buildService(
        undefined,
        {
          queueItemRepository: {
            getQueueItemById: jest.fn().mockResolvedValue({
              _id: 'queue-item-1',
              queueId: 'queue-1',
              status: EQueueItemStatus.WAITING,
              position: 1,
            }),
            listQueueItems: jest.fn().mockResolvedValue(remainingItems),
            updateQueueItemById: jest.fn().mockResolvedValue(null),
          },
        },
      );

      await service.cancelAppointment('appointment-1', {
        sub: 'user-1',
        isAdmin: false,
      });

      expect(queueItemRepository.deleteQueueItemById).toHaveBeenCalledWith(
        'queue-item-1',
      );
      expect(queueRepository.deleteQueueById).not.toHaveBeenCalled();
      expect(queueItemRepository.updateQueueItemById).toHaveBeenCalledWith(
        'queue-item-2',
        { position: 1 },
      );
      expect(queueItemRepository.updateQueueItemById).toHaveBeenCalledWith(
        'queue-item-3',
        { position: 2 },
      );
    });

    it('does not remove the queue item when it is no longer waiting (e.g. already in service)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-09T11:00:00.000Z'));
      const { service, queueItemRepository, queueRepository } = buildService(
        undefined,
        {
          queueItemRepository: {
            getQueueItemById: jest.fn().mockResolvedValue({
              _id: 'queue-item-1',
              queueId: 'queue-1',
              status: EQueueItemStatus.IN_SERVICE,
              position: 1,
            }),
          },
        },
      );

      await service.cancelAppointment('appointment-1', {
        sub: 'user-1',
        isAdmin: false,
      });

      expect(queueItemRepository.deleteQueueItemById).not.toHaveBeenCalled();
      expect(queueRepository.deleteQueueById).not.toHaveBeenCalled();
    });
  });
});
