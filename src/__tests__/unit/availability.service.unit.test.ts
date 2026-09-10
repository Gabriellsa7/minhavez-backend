import { AvailabilityService } from '../../domain/availability/service/availability.service';
import { IHealthProfessionalRepository } from '../../domain/health-professional.ts/repository/health-professional.repository.interface';
import { IHealthUnitRepository } from '../../domain/health-unit/repository/health-unit.repository.interface';
import { IAppointmentRepository } from '../../domain/appointment/repository/appointment.repository.interface';
import {
  EAppointmentStatus,
  IAppointment,
} from '../../domain/appointment/interfaces/appointment.interface';
import {
  IHealthUnit,
  WeekDay,
} from '../../domain/health-unit/interfaces/health-unit.interface';
import { EHealthProfessionalType } from '../../domain/health-professional.ts/interfaces/health-professional.interface';

function buildAppointment(overrides: Partial<IAppointment>): IAppointment {
  return {
    _id: 'appt',
    patientId: 'patient-1',
    professionalId: 'professional-1',
    healthUnitId: 'unit-1',
    queueItemId: null,
    dateTime: new Date(),
    status: EAppointmentStatus.SCHEDULED,
    isReturn: false,
    returnScheduled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AvailabilityService.getAvailableSlots', () => {
  it('offers the free gaps between already-booked appointments (e.g. 10:00, 10:15, 11:30 booked with a 15-minute slot leaves 10:30 and 11:00 free)', async () => {
    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        healthUnitId: 'unit-1',
        schedule: {
          appointmentDuration: 15,
          morning: { start: '10:00', end: '12:00' },
        },
        type: EHealthProfessionalType.GENERAL,
      }),
    } as unknown as IHealthProfessionalRepository;

    const healthUnit: Partial<IHealthUnit> = {
      _id: 'unit-1',
      openingHours: Object.values(WeekDay).map((day) => ({
        day,
        open: '00:00',
        close: '23:59',
        isClosed: false,
      })),
    };

    const healthUnitRepository = {
      getHealthUnitById: jest.fn().mockResolvedValue(healthUnit),
    } as unknown as IHealthUnitRepository;

    const bookedDateKey = '2026-10-10';
    const bookedTimes = ['10:00', '10:15', '11:30'];

    const appointmentRepository = {
      listAppointmentsByProfessionalId: jest.fn().mockResolvedValue(
        bookedTimes.map((time, index) =>
          buildAppointment({
            _id: `appt-${index}`,
            dateTime: new Date(`${bookedDateKey}T${time}:00-03:00`),
          }),
        ),
      ),
    } as unknown as IAppointmentRepository;

    const service = new AvailabilityService({
      healthProfessionalRepository: professionalRepository,
      healthUnitRepository,
      appointmentRepository,
    });

    const slots = await service.getAvailableSlots(
      'professional-1',
      bookedDateKey,
    );

    const times = slots.map((slot) => slot.time);

    expect(times).toContain('10:30');
    expect(times).toContain('11:00');
    expect(times).not.toContain('10:00');
    expect(times).not.toContain('10:15');
    expect(times).not.toContain('11:30');
  });

  it('excludes completed and canceled appointments from the booked set', async () => {
    const professionalRepository = {
      getHealthProfessionalById: jest.fn().mockResolvedValue({
        _id: 'professional-1',
        healthUnitId: 'unit-1',
        schedule: {
          appointmentDuration: 30,
          morning: { start: '10:00', end: '11:00' },
        },
      }),
    } as unknown as IHealthProfessionalRepository;

    const healthUnit: Partial<IHealthUnit> = {
      _id: 'unit-1',
      openingHours: Object.values(WeekDay).map((day) => ({
        day,
        open: '00:00',
        close: '23:59',
        isClosed: false,
      })),
    };

    const healthUnitRepository = {
      getHealthUnitById: jest.fn().mockResolvedValue(healthUnit),
    } as unknown as IHealthUnitRepository;

    const dateKey = '2026-10-10';

    const appointmentRepository = {
      listAppointmentsByProfessionalId: jest.fn().mockResolvedValue([
        buildAppointment({
          _id: 'cancelled',
          dateTime: new Date(`${dateKey}T10:00:00-03:00`),
          status: EAppointmentStatus.CANCELED,
        }),
      ]),
    } as unknown as IAppointmentRepository;

    const service = new AvailabilityService({
      healthProfessionalRepository: professionalRepository,
      healthUnitRepository,
      appointmentRepository,
    });

    const slots = await service.getAvailableSlots('professional-1', dateKey);

    expect(slots.map((slot) => slot.time)).toContain('10:00');
  });
});
