import { ExamBookingService } from '../../domain/exam-booking/service/exam-booking.service';
import {
  EExamBookingStatus,
  IExamBooking,
} from '../../domain/exam-booking/interfaces/exam-booking.interface';
import { WeekDay } from '../../domain/health-unit/interfaces/health-unit.interface';
import { IExamOffering } from '../../domain/exam-offering/interfaces/exam-offering.interface';
import { IExamAvailabilityRule } from '../../domain/exam-availability/interfaces/exam-availability.interface';
import { IPatient } from '../../domain/patient/interfaces/patient.interface';

const WEEKDAYS_BY_JS_INDEX: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

function futureSlot(daysAhead: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

const PATIENT: IPatient = {
  _id: 'patient-1',
  userId: 'user-1',
  cpf: '11122233344',
  birthDate: '1990-01-01',
  priority: 'NORMAL' as IPatient['priority'],
  phone: '11999999999',
  medicalDocuments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const OFFERING: IExamOffering = {
  _id: 'offering-1',
  healthUnitId: 'unit-1',
  name: 'Hemograma',
  durationMinutes: 20,
  requiresPreparation: false,
  requiresFasting: false,
  acceptedInsurances: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildService(overrides?: {
  reserveSlot?: jest.Mock;
  isDateBlackedOut?: jest.Mock;
  rules?: IExamAvailabilityRule[];
  offering?: IExamOffering;
  existingBookings?: IExamBooking[];
}) {
  const scheduledAt = futureSlot(7, 9, 0);
  const weekday = WEEKDAYS_BY_JS_INDEX[scheduledAt.getUTCDay()];

  const defaultRule: IExamAvailabilityRule = {
    _id: 'rule-1',
    healthUnitId: 'unit-1',
    weekday,
    startTime: '08:00',
    endTime: '12:00',
    slotDurationMinutes: 15,
    capacityPerSlot: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createExamBooking = jest.fn(
    async (data: Partial<IExamBooking>): Promise<IExamBooking> => ({
      _id: 'booking-1',
      patientId: PATIENT._id,
      healthUnitId: 'unit-1',
      examOfferingId: OFFERING._id,
      scheduledAt,
      durationMinutes: OFFERING.durationMinutes,
      status: EExamBookingStatus.SCHEDULED,
      slotKey: `unit-1_${scheduledAt.toISOString()}`,
      createdByUserId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }),
  );

  const examBookingRepository = {
    reserveSlot: overrides?.reserveSlot ?? jest.fn(async () => true),
    releaseSlot: jest.fn(async () => {}),
    getBookedCountsForSlots: jest.fn(async () => new Map()),
    createExamBooking,
    getExamBookingById: jest.fn(
      async (_id: string): Promise<IExamBooking | null> => null,
    ),
    updateExamBookingById: jest.fn(
      async (
        _id: string,
        _params: Partial<IExamBooking>,
      ): Promise<IExamBooking | null> => null,
    ),
    listExamBookingsByPatientId: jest.fn(
      async () => overrides?.existingBookings ?? [],
    ),
    listExamBookingsByHealthUnitId: jest.fn(async () => []),
  };

  const examOfferingRepository = {
    createExamOffering: jest.fn(),
    updateExamOfferingById: jest.fn(),
    getExamOfferingById: jest.fn(async () => overrides?.offering ?? OFFERING),
    listExamOfferingsByHealthUnitId: jest.fn(async () => []),
  };

  const examAvailabilityRepository = {
    replaceRulesForHealthUnit: jest.fn(),
    listRulesByHealthUnitId: jest.fn(
      async () => overrides?.rules ?? [defaultRule],
    ),
    createBlackout: jest.fn(),
    getBlackoutById: jest.fn(),
    deleteBlackoutById: jest.fn(),
    listBlackoutsByHealthUnitId: jest.fn(),
    isDateBlackedOut: overrides?.isDateBlackedOut ?? jest.fn(async () => false),
  };

  const patientRepository = {
    createPatient: jest.fn(),
    updatePatientById: jest.fn(),
    deletePatientById: jest.fn(),
    getPatientById: jest.fn(async () => PATIENT),
    getPatientByUserId: jest.fn(async () => PATIENT),
    getPatientByCpf: jest.fn(),
    listPatients: jest.fn(),
  };

  const healthUnitRepository = {
    createHealthUnit: jest.fn(),
    updateHealthUnitById: jest.fn(),
    deleteHealthUnitById: jest.fn(),
    getHealthUnitByEmail: jest.fn(),
    getHealthUnitById: jest.fn(async () => ({
      _id: 'unit-1',
      userId: 'admin-1',
      name: 'Clinic',
    })),
    getHealthUnitsByUserId: jest.fn(),
    listHealthUnits: jest.fn(),
  };

  const examRepository = {
    createExam: jest.fn(),
    getExamById: jest.fn(),
    listExamsByPatientId: jest.fn(),
    listExamsByHealthUnitId: jest.fn(),
    listExamsByPatientIds: jest.fn(),
    setExamBookingId: jest.fn(),
  };

  const userRepository = {
    findById: jest.fn(async () => ({ _id: 'user-1', name: 'John Doe' })),
  };

  const service = new ExamBookingService({
    examBookingRepository: examBookingRepository as never,
    examOfferingRepository: examOfferingRepository as never,
    examAvailabilityRepository: examAvailabilityRepository as never,
    patientRepository: patientRepository as never,
    healthUnitRepository: healthUnitRepository as never,
    examRepository: examRepository as never,
    userRepository: userRepository as never,
  });

  return { service, examBookingRepository, scheduledAt };
}

describe('ExamBookingService.createBooking', () => {
  const requester = { sub: 'user-1', isAdmin: false, isExamProfessional: false };

  it('books a valid future slot successfully', async () => {
    const { service, scheduledAt } = buildService();

    const booking = await service.createBooking(
      { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
      requester,
    );

    expect(booking.status).toBe(EExamBookingStatus.SCHEDULED);
    expect(booking.examOfferingName).toBe('Hemograma');
  });

  it('rejects booking an inactive offering', async () => {
    const { service, scheduledAt } = buildService({
      offering: { ...OFFERING, isActive: false },
    });

    await expect(
      service.createBooking(
        { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects an offering that does not belong to the given clinic', async () => {
    const { service, scheduledAt } = buildService({
      offering: { ...OFFERING, healthUnitId: 'other-unit' },
    });

    await expect(
      service.createBooking(
        { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a time in the past', async () => {
    const { service } = buildService();
    const past = new Date(Date.now() - 60_000);

    await expect(
      service.createBooking(
        { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt: past },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a blacked-out date', async () => {
    const { service, scheduledAt } = buildService({
      isDateBlackedOut: jest.fn(async () => true),
    });

    await expect(
      service.createBooking(
        { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a day with no availability rule', async () => {
    const { service, scheduledAt } = buildService({ rules: [] });

    await expect(
      service.createBooking(
        { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a time that does not align to a slot boundary', async () => {
    const { service, scheduledAt } = buildService();
    const misaligned = new Date(scheduledAt);
    misaligned.setUTCMinutes(misaligned.getUTCMinutes() + 7);

    await expect(
      service.createBooking(
        {
          healthUnitId: 'unit-1',
          examOfferingId: 'offering-1',
          scheduledAt: misaligned,
        },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('returns 409 when the slot is already at capacity', async () => {
    const { service, scheduledAt } = buildService({
      reserveSlot: jest.fn(async () => false),
    });

    await expect(
      service.createBooking(
        { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
        requester,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rejects a booking attempt made by a clinic admin', async () => {
    const { service, scheduledAt } = buildService();

    await expect(
      service.createBooking(
        { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
        { sub: 'admin-1', isAdmin: true, isExamProfessional: false },
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("ExamBookingService.createBooking minimum gap between the patient's bookings", () => {
  const requester = { sub: 'user-1', isAdmin: false, isExamProfessional: false };

  function buildOtherBooking(overrides: Partial<IExamBooking>): IExamBooking {
    return {
      _id: 'other-booking',
      patientId: PATIENT._id,
      healthUnitId: 'unit-1',
      examOfferingId: OFFERING._id,
      scheduledAt: futureSlot(7, 9, 0),
      durationMinutes: OFFERING.durationMinutes,
      status: EExamBookingStatus.SCHEDULED,
      slotKey: 'unit-1_other',
      createdByUserId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  it('rejects a new booking less than 2h from another active booking of the same patient', async () => {
    const baseScheduledAt = futureSlot(7, 9, 0);
    const { service, scheduledAt } = buildService({
      existingBookings: [
        buildOtherBooking({
          scheduledAt: new Date(baseScheduledAt.getTime() + 60 * 60 * 1000),
        }),
      ],
    });

    await expect(
      service.createBooking(
        { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('accepts a new booking exactly 2h from another active booking of the same patient', async () => {
    const baseScheduledAt = futureSlot(7, 9, 0);
    const { service, scheduledAt } = buildService({
      existingBookings: [
        buildOtherBooking({
          scheduledAt: new Date(baseScheduledAt.getTime() + 2 * 60 * 60 * 1000),
        }),
      ],
    });

    const booking = await service.createBooking(
      { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
      requester,
    );

    expect(booking.status).toBe(EExamBookingStatus.SCHEDULED);
  });

  it('ignores canceled/no-show bookings when checking the gap', async () => {
    const baseScheduledAt = futureSlot(7, 9, 0);
    const { service, scheduledAt } = buildService({
      existingBookings: [
        buildOtherBooking({
          scheduledAt: new Date(baseScheduledAt.getTime() + 30 * 60 * 1000),
          status: EExamBookingStatus.CANCELED,
        }),
        buildOtherBooking({
          scheduledAt: new Date(baseScheduledAt.getTime() - 30 * 60 * 1000),
          status: EExamBookingStatus.NO_SHOW,
        }),
      ],
    });

    const booking = await service.createBooking(
      { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
      requester,
    );

    expect(booking.status).toBe(EExamBookingStatus.SCHEDULED);
  });

  it('allows multiple bookings on the same day as long as each is at least 2h apart', async () => {
    const baseScheduledAt = futureSlot(7, 9, 0);
    const { service, scheduledAt } = buildService({
      existingBookings: [
        buildOtherBooking({
          scheduledAt: new Date(baseScheduledAt.getTime() - 2 * 60 * 60 * 1000),
        }),
        buildOtherBooking({
          scheduledAt: new Date(baseScheduledAt.getTime() + 2 * 60 * 60 * 1000),
        }),
      ],
    });

    const booking = await service.createBooking(
      { healthUnitId: 'unit-1', examOfferingId: 'offering-1', scheduledAt },
      requester,
    );

    expect(booking.status).toBe(EExamBookingStatus.SCHEDULED);
  });
});

describe('ExamBookingService status transitions', () => {
  const scheduledPastBooking: IExamBooking = {
    _id: 'booking-1',
    patientId: PATIENT._id,
    healthUnitId: 'unit-1',
    examOfferingId: OFFERING._id,
    scheduledAt: new Date(Date.now() - 3600_000),
    durationMinutes: 20,
    status: EExamBookingStatus.SCHEDULED,
    slotKey: 'unit-1_x',
    createdByUserId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function buildServiceWithBooking(booking: IExamBooking) {
    const { service, examBookingRepository } = buildService();
    examBookingRepository.getExamBookingById.mockResolvedValue(booking);
    examBookingRepository.updateExamBookingById.mockImplementation(
      async (_id: string, params: Partial<IExamBooking>) => ({
        ...booking,
        ...params,
      }),
    );
    return { service, examBookingRepository };
  }

  it('rejects a non-admin trying to change status', async () => {
    const { service } = buildServiceWithBooking(scheduledPastBooking);

    await expect(
      service.updateStatus(
        'booking-1',
        EExamBookingStatus.IN_PROGRESS,
        { sub: 'user-1', isAdmin: false, isExamProfessional: false },
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('allows staff to move SCHEDULED -> IN_PROGRESS -> COMPLETED', async () => {
    const { service, examBookingRepository } = buildServiceWithBooking(
      scheduledPastBooking,
    );

    await service.updateStatus('booking-1', EExamBookingStatus.IN_PROGRESS, {
      sub: 'admin-1',
      isAdmin: true,
      isExamProfessional: false,
    });

    examBookingRepository.getExamBookingById.mockResolvedValue({
      ...scheduledPastBooking,
      status: EExamBookingStatus.IN_PROGRESS,
    });

    const completed = await service.updateStatus(
      'booking-1',
      EExamBookingStatus.COMPLETED,
      { sub: 'admin-1', isAdmin: true, isExamProfessional: false },
    );

    expect(completed.status).toBe(EExamBookingStatus.COMPLETED);
  });

  it('rejects transitioning a terminal booking', async () => {
    const { service } = buildServiceWithBooking({
      ...scheduledPastBooking,
      status: EExamBookingStatus.CANCELED,
    });

    await expect(
      service.updateStatus('booking-1', EExamBookingStatus.IN_PROGRESS, {
        sub: 'admin-1',
        isAdmin: true,
        isExamProfessional: false,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects canceling an already-completed booking', async () => {
    const { service } = buildServiceWithBooking({
      ...scheduledPastBooking,
      status: EExamBookingStatus.COMPLETED,
    });

    await expect(
      service.cancelBooking('booking-1', { sub: 'user-1', isAdmin: false, isExamProfessional: false }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
