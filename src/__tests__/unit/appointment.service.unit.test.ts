import { AppointmentService } from '../../domain/appointment/service/appointment.service';
import {
  EAppointmentStatus,
  IAppointment,
} from '../../domain/appointment/interfaces/appointment.interface';
import {
  IAppointmentRepository,
  IParamsCreateAppointment,
} from '../../domain/appointment/repository/appointment.repository.interface';
import { EQueueStatus } from '../../domain/queue/interfaces/queue.interface';
import { IQueueRepository } from '../../domain/queue/repository/queue.repository.interface';
import {
  EQueueItemPriority,
  EQueueItemStatus,
} from '../../domain/queue-item/interfaces/queue-item.interface';
import { IQueueItemRepository } from '../../domain/queue-item/repository/queue-item.repository.interface';

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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
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

    const service = new AppointmentService({
      appointmentRepository: repository,
      queueRepository,
      queueItemRepository,
    });

    const params: IParamsCreateAppointment = {
      patientId: 'patient-2',
      professionalId: 'professional-1',
      healthUnitId: 'unit-1',
      dateTime: '2026-07-06T13:00:00.000Z',
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
});
