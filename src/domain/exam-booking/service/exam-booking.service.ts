import { AppError } from '../../../shared/errors/AppError';
import { IExamOfferingRepository } from '../../exam-offering/repository/exam-offering.repository.interface';
import { IExamAvailabilityRepository } from '../../exam-availability/repository/exam-availability.repository.interface';
import { IExamAvailabilityRule } from '../../exam-availability/interfaces/exam-availability.interface';
import { IPatientRepository } from '../../patient/repository/patient.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IExamRepository } from '../../exam/repository/exam.repository.interface';
import { IUserRepository } from '../../user/repository/user.repository.interface';
import { IExamBookingRepository } from '../repository/exam-booking.repository.interface';
import {
  EExamBookingCanceledBy,
  EExamBookingStatus,
  IExamBooking,
  IExamBookingWithContext,
} from '../interfaces/exam-booking.interface';
import {
  IExamBookingRequester,
  IExamBookingService,
  IExamSlotAvailability,
  IParamsCreateExamBooking,
  IParamsExamBookingService,
} from '../interfaces/exam-booking.service.interface';
import {
  WEEKDAYS_BY_JS_INDEX,
  buildSlotKey,
  generateSlotTimes,
  startOfUtcDay,
} from '../utils/exam-slot';
import { IPaginationParams } from '../../../shared/utils/pagination';

export class ExamBookingService implements IExamBookingService {
  private examBookingRepository: IExamBookingRepository;
  private examOfferingRepository: IExamOfferingRepository;
  private examAvailabilityRepository: IExamAvailabilityRepository;
  private patientRepository: IPatientRepository;
  private healthUnitRepository: IHealthUnitRepository;
  private examRepository: IExamRepository;
  private userRepository: IUserRepository;

  constructor(params: IParamsExamBookingService) {
    this.examBookingRepository = params.examBookingRepository;
    this.examOfferingRepository = params.examOfferingRepository;
    this.examAvailabilityRepository = params.examAvailabilityRepository;
    this.patientRepository = params.patientRepository;
    this.healthUnitRepository = params.healthUnitRepository;
    this.examRepository = params.examRepository;
    this.userRepository = params.userRepository;
  }

  private async assertOwnsHealthUnit(
    healthUnitId: string,
    requester: IExamBookingRequester,
  ) {
    if (requester.isExamProfessional) {
      if (requester.healthUnitId !== healthUnitId) {
        throw new AppError(403, 'Forbidden');
      }

      const healthUnit =
        await this.healthUnitRepository.getHealthUnitById(healthUnitId);

      if (!healthUnit) {
        throw new AppError(404, 'Health unit not found');
      }

      return healthUnit;
    }

    if (!requester.isAdmin) {
      throw new AppError(403, 'Forbidden');
    }

    const healthUnit =
      await this.healthUnitRepository.getHealthUnitById(healthUnitId);

    if (!healthUnit) {
      throw new AppError(404, 'Health unit not found');
    }

    if (healthUnit.userId !== requester.sub) {
      throw new AppError(403, 'Forbidden');
    }

    return healthUnit;
  }

  private async getActiveRuleForDate(
    healthUnitId: string,
    scheduledAt: Date,
  ): Promise<IExamAvailabilityRule | null> {
    const weekday = WEEKDAYS_BY_JS_INDEX[scheduledAt.getUTCDay()];
    const rules =
      await this.examAvailabilityRepository.listRulesByHealthUnitId(
        healthUnitId,
      );

    return (
      rules.find((rule) => rule.weekday === weekday && rule.isActive) ?? null
    );
  }

  private async assertBookableSlot(
    healthUnitId: string,
    scheduledAt: Date,
  ): Promise<IExamAvailabilityRule> {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new AppError(400, 'Cannot book a time in the past');
    }

    const isBlackedOut = await this.examAvailabilityRepository.isDateBlackedOut(
      healthUnitId,
      scheduledAt,
    );

    if (isBlackedOut) {
      throw new AppError(400, 'This date is unavailable for booking');
    }

    const rule = await this.getActiveRuleForDate(healthUnitId, scheduledAt);

    if (!rule) {
      throw new AppError(400, 'This clinic is closed on the selected day');
    }

    const validTimes = generateSlotTimes(rule);
    const hhmm = `${scheduledAt.getUTCHours().toString().padStart(2, '0')}:${scheduledAt
      .getUTCMinutes()
      .toString()
      .padStart(2, '0')}`;

    if (!validTimes.includes(hhmm)) {
      throw new AppError(400, 'Invalid time slot');
    }

    return rule;
  }

  private async enrich(
    booking: IExamBooking,
  ): Promise<IExamBookingWithContext> {
    const [offering, healthUnit, patient] = await Promise.all([
      this.examOfferingRepository.getExamOfferingById(
        booking.examOfferingId,
      ),
      this.healthUnitRepository.getHealthUnitById(booking.healthUnitId),
      this.patientRepository.getPatientById(booking.patientId),
    ]);

    const user = patient
      ? await this.userRepository.findById(patient.userId)
      : null;

    return {
      ...booking,
      examOfferingName: offering?.name ?? '',
      healthUnitName: healthUnit?.name ?? '',
      patientName: user?.name ?? '',
      patientCpf: patient?.cpf ?? '',
    };
  }

  private async assertCanAccessBooking(
    booking: IExamBooking,
    requester: IExamBookingRequester,
  ): Promise<void> {
    if (requester.isAdmin) {
      const healthUnit = await this.healthUnitRepository.getHealthUnitById(
        booking.healthUnitId,
      );
      if (healthUnit?.userId === requester.sub) return;
      throw new AppError(403, 'Forbidden');
    }

    const patient = await this.patientRepository.getPatientByUserId(
      requester.sub,
    );

    if (patient?._id === booking.patientId) return;

    throw new AppError(403, 'Forbidden');
  }

  async createBooking(
    params: IParamsCreateExamBooking,
    requester: IExamBookingRequester,
  ): Promise<IExamBookingWithContext> {
    if (requester.isAdmin) {
      throw new AppError(403, 'Only patients can book exams');
    }

    let patient;

    if (requester.isReceptionist) {
      if (!params.patientId) {
        throw new AppError(400, 'patientId is required');
      }

      if (
        requester.healthUnitId &&
        params.healthUnitId !== requester.healthUnitId
      ) {
        throw new AppError(
          403,
          'You can only book exams for your own health unit',
        );
      }

      patient = await this.patientRepository.getPatientById(params.patientId);

      if (!patient) {
        throw new AppError(404, 'Patient not found');
      }
    } else {
      patient = await this.patientRepository.getPatientByUserId(
        requester.sub,
      );

      if (!patient) {
        throw new AppError(400, 'Patient profile is required to book an exam');
      }
    }

    const offering = await this.examOfferingRepository.getExamOfferingById(
      params.examOfferingId,
    );

    if (!offering || offering.healthUnitId !== params.healthUnitId) {
      throw new AppError(400, 'This exam is not offered by this clinic');
    }

    if (!offering.isActive) {
      throw new AppError(400, 'This exam is not currently available');
    }

    const rule = await this.assertBookableSlot(
      params.healthUnitId,
      params.scheduledAt,
    );

    const slotKey = buildSlotKey(params.healthUnitId, params.scheduledAt);

    const reserved = await this.examBookingRepository.reserveSlot(
      params.healthUnitId,
      slotKey,
      rule.capacityPerSlot,
    );

    if (!reserved) {
      throw new AppError(409, 'This time slot is fully booked');
    }

    try {
      const booking = await this.examBookingRepository.createExamBooking({
        patientId: patient._id,
        healthUnitId: params.healthUnitId,
        examOfferingId: params.examOfferingId,
        scheduledAt: params.scheduledAt,
        durationMinutes: offering.durationMinutes,
        priceSnapshot: offering.price,
        slotKey,
        createdByUserId: requester.sub,
        notes: params.notes,
      });

      return this.enrich(booking);
    } catch (error) {
      await this.examBookingRepository.releaseSlot(
        params.healthUnitId,
        slotKey,
      );
      throw error;
    }
  }

  async cancelBooking(
    id: string,
    requester: IExamBookingRequester,
    reason?: string,
  ): Promise<IExamBookingWithContext> {
    const booking = await this.examBookingRepository.getExamBookingById(id);

    if (!booking) {
      throw new AppError(404, 'Exam booking not found');
    }

    await this.assertCanAccessBooking(booking, requester);

    if (
      booking.status !== EExamBookingStatus.SCHEDULED &&
      booking.status !== EExamBookingStatus.CONFIRMED
    ) {
      throw new AppError(400, 'This booking can no longer be canceled');
    }

    const updated = await this.examBookingRepository.updateExamBookingById(
      id,
      {
        status: EExamBookingStatus.CANCELED,
        canceledAt: new Date(),
        canceledBy: requester.isAdmin
          ? EExamBookingCanceledBy.STAFF
          : EExamBookingCanceledBy.PATIENT,
        cancelReason: reason,
      },
    );

    await this.examBookingRepository.releaseSlot(
      booking.healthUnitId,
      booking.slotKey,
    );

    return this.enrich(updated!);
  }

  async rescheduleBooking(
    id: string,
    newScheduledAt: Date,
    requester: IExamBookingRequester,
  ): Promise<IExamBookingWithContext> {
    const booking = await this.examBookingRepository.getExamBookingById(id);

    if (!booking) {
      throw new AppError(404, 'Exam booking not found');
    }

    await this.assertCanAccessBooking(booking, requester);

    if (
      booking.status !== EExamBookingStatus.SCHEDULED &&
      booking.status !== EExamBookingStatus.CONFIRMED
    ) {
      throw new AppError(400, 'This booking can no longer be rescheduled');
    }

    await this.cancelBooking(id, requester, 'Reagendado');

    return this.createBooking(
      {
        healthUnitId: booking.healthUnitId,
        examOfferingId: booking.examOfferingId,
        scheduledAt: newScheduledAt,
        notes: booking.notes,
      },
      requester,
    );
  }

  async updateStatus(
    id: string,
    newStatus: EExamBookingStatus,
    requester: IExamBookingRequester,
  ): Promise<IExamBookingWithContext> {
    const booking = await this.examBookingRepository.getExamBookingById(id);

    if (!booking) {
      throw new AppError(404, 'Exam booking not found');
    }

    await this.assertOwnsHealthUnit(booking.healthUnitId, requester);

    const isActiveStatus =
      booking.status === EExamBookingStatus.SCHEDULED ||
      booking.status === EExamBookingStatus.CONFIRMED;

    if (newStatus === EExamBookingStatus.IN_PROGRESS) {
      if (!isActiveStatus) {
        throw new AppError(400, 'Invalid status transition');
      }
    } else if (newStatus === EExamBookingStatus.COMPLETED) {
      if (booking.status !== EExamBookingStatus.IN_PROGRESS) {
        throw new AppError(400, 'Invalid status transition');
      }
    } else if (newStatus === EExamBookingStatus.NO_SHOW) {
      if (!isActiveStatus) {
        throw new AppError(400, 'Invalid status transition');
      }
      if (booking.scheduledAt.getTime() > Date.now()) {
        throw new AppError(
          400,
          'Cannot mark as no-show before the scheduled time',
        );
      }
    } else {
      throw new AppError(400, 'Invalid status transition');
    }

    const updated = await this.examBookingRepository.updateExamBookingById(
      id,
      { status: newStatus },
    );

    return this.enrich(updated!);
  }

  async getBookingById(
    id: string,
    requester: IExamBookingRequester,
  ): Promise<IExamBookingWithContext> {
    const booking = await this.examBookingRepository.getExamBookingById(id);

    if (!booking) {
      throw new AppError(404, 'Exam booking not found');
    }

    await this.assertCanAccessBooking(booking, requester);

    return this.enrich(booking);
  }

  async listBookingsByPatientId(
    patientId: string,
    requester: IExamBookingRequester,
    pagination?: IPaginationParams | null,
  ): Promise<{ items: IExamBookingWithContext[]; totalItems: number }> {
    const patient = await this.patientRepository.getPatientById(patientId);

    if (!patient) {
      throw new AppError(404, 'Patient not found');
    }

    const bookings =
      await this.examBookingRepository.listExamBookingsByPatientId(
        patientId,
      );

    let authorizedBookings: IExamBooking[];

    if (requester.isAdmin) {
      const uniqueHealthUnitIds = [
        ...new Set(bookings.map((booking) => booking.healthUnitId)),
      ];
      const healthUnits = await Promise.all(
        uniqueHealthUnitIds.map((id) =>
          this.healthUnitRepository.getHealthUnitById(id),
        ),
      );
      const ownedHealthUnitIds = new Set(
        healthUnits
          .filter((healthUnit) => healthUnit?.userId === requester.sub)
          .map((healthUnit) => healthUnit!._id),
      );

      authorizedBookings = bookings.filter((booking) =>
        ownedHealthUnitIds.has(booking.healthUnitId),
      );
    } else if (requester.isExamProfessional) {
      authorizedBookings = bookings.filter(
        (booking) => booking.healthUnitId === requester.healthUnitId,
      );
    } else if (patient.userId === requester.sub) {
      authorizedBookings = bookings;
    } else {
      throw new AppError(403, 'Forbidden');
    }

    const totalItems = authorizedBookings.length;
    const pageBookings = pagination
      ? authorizedBookings.slice(
          pagination.skip,
          pagination.skip + pagination.limit,
        )
      : authorizedBookings;

    const items = await Promise.all(
      pageBookings.map((booking) => this.enrich(booking)),
    );

    return { items, totalItems };
  }

  async listBookingsByHealthUnitId(
    healthUnitId: string,
    requester: IExamBookingRequester,
    filter: {
      date?: Date;
      startDate?: Date;
      endDate?: Date;
      status?: EExamBookingStatus;
    },
  ): Promise<IExamBookingWithContext[]> {
    await this.assertOwnsHealthUnit(healthUnitId, requester);

    const bookings =
      await this.examBookingRepository.listExamBookingsByHealthUnitId(
        healthUnitId,
        filter,
      );

    return Promise.all(bookings.map((booking) => this.enrich(booking)));
  }

  async getAvailableSlots(
    healthUnitId: string,
    date: Date,
  ): Promise<IExamSlotAvailability[]> {
    const day = startOfUtcDay(date);

    const isBlackedOut = await this.examAvailabilityRepository.isDateBlackedOut(
      healthUnitId,
      day,
    );

    if (isBlackedOut) {
      return [];
    }

    const rule = await this.getActiveRuleForDate(healthUnitId, day);

    if (!rule) {
      return [];
    }

    const times = generateSlotTimes(rule);
    const slotDates = times.map((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return new Date(
        Date.UTC(
          day.getUTCFullYear(),
          day.getUTCMonth(),
          day.getUTCDate(),
          hours,
          minutes,
        ),
      );
    });

    const slotKeys = slotDates.map((slotDate) =>
      buildSlotKey(healthUnitId, slotDate),
    );

    const bookedCounts = await this.examBookingRepository.getBookedCountsForSlots(
      healthUnitId,
      slotKeys,
    );

    const now = Date.now();

    return times
      .map((time, index) => {
        const slotDate = slotDates[index];
        const counter = bookedCounts.get(slotKeys[index]);
        const bookedCount = counter?.bookedCount ?? 0;
        const remainingCapacity = rule.capacityPerSlot - bookedCount;

        return {
          time,
          remainingCapacity,
          isPast: slotDate.getTime() <= now,
        };
      })
      .filter((slot) => !slot.isPast && slot.remainingCapacity > 0)
      .map(({ time, remainingCapacity }) => ({ time, remainingCapacity }));
  }

  async linkResultExam(
    bookingId: string,
    examId: string,
    requester: IExamBookingRequester,
  ): Promise<void> {
    const booking = await this.examBookingRepository.getExamBookingById(
      bookingId,
    );

    if (!booking) {
      throw new AppError(404, 'Exam booking not found');
    }

    await this.assertOwnsHealthUnit(booking.healthUnitId, requester);

    if (booking.status !== EExamBookingStatus.COMPLETED) {
      throw new AppError(
        400,
        'Only completed bookings can be linked to a result',
      );
    }

    if (booking.resultExamId) {
      throw new AppError(400, 'This booking already has a linked result');
    }

    const exam = await this.examRepository.getExamById(examId);

    if (!exam) {
      throw new AppError(404, 'Exam result not found');
    }

    if (
      exam.patientId !== booking.patientId ||
      exam.healthUnitId !== booking.healthUnitId
    ) {
      throw new AppError(
        400,
        'This exam result does not belong to the same patient/clinic as the booking',
      );
    }

    await this.examRepository.setExamBookingId(examId, bookingId);
    await this.examBookingRepository.updateExamBookingById(bookingId, {
      resultExamId: examId,
    });
  }
}
