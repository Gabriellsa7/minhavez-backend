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
});
