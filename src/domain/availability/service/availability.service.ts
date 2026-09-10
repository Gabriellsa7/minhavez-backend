import { IHealthProfessionalRepository } from '../../health-professional.ts/repository/health-professional.repository.interface';
import { IHealthUnitRepository } from '../../health-unit/repository/health-unit.repository.interface';
import { IAppointmentRepository } from '../../appointment/repository/appointment.repository.interface';
import { EAppointmentStatus } from '../../appointment/interfaces/appointment.interface';
import { EQueueShift } from '../../queue/interfaces/queue.interface';
import { isHealthUnitOpenAt } from '../../health-unit/utils/opening-hours.util';
import { generateTimeSlots, parseDateKey } from '../../../shared/utils/scheduleSlots';
import {
  fromBrazilWallClock,
  isSameBrazilDay,
  toBrazilDate,
} from '../../../shared/utils/brazilTime';
import { AppError } from '../../../shared/errors/AppError';

export interface IAvailableSlot {
  time: string;
  dateTime: string;
}

export class AvailabilityService {
  private healthProfessionalRepository: IHealthProfessionalRepository;
  private healthUnitRepository: IHealthUnitRepository;
  private appointmentRepository: IAppointmentRepository;

  constructor(params: {
    healthProfessionalRepository: IHealthProfessionalRepository;
    healthUnitRepository: IHealthUnitRepository;
    appointmentRepository: IAppointmentRepository;
  }) {
    this.healthProfessionalRepository = params.healthProfessionalRepository;
    this.healthUnitRepository = params.healthUnitRepository;
    this.appointmentRepository = params.appointmentRepository;
  }

  async getAvailableSlots(
    professionalId: string,
    dateKey: string,
    shift?: EQueueShift,
  ): Promise<IAvailableSlot[]> {
    const professional =
      await this.healthProfessionalRepository.getHealthProfessionalById(
        professionalId,
      );

    if (!professional) {
      throw new AppError(404, 'Health professional not found');
    }

    const healthUnit = await this.healthUnitRepository.getHealthUnitById(
      professional.healthUnitId,
    );

    if (!healthUnit) {
      throw new AppError(404, 'Health unit not found');
    }

    const { year, month, day } = parseDateKey(dateKey);
    const duration = professional.schedule.appointmentDuration;

    const shifts =
      shift === EQueueShift.MORNING
        ? [professional.schedule.morning]
        : shift === EQueueShift.AFTERNOON
          ? [professional.schedule.afternoon]
          : [professional.schedule.morning, professional.schedule.afternoon];

    const candidateTimes = shifts.flatMap((shiftHours) =>
      generateTimeSlots(
        shiftHours?.start || '',
        shiftHours?.end || '',
        duration,
      ),
    );

    const appointments =
      await this.appointmentRepository.listAppointmentsByProfessionalId(
        professionalId,
      );

    const referenceDay = fromBrazilWallClock(year, month, day, 12, 0);

    const bookedTimes = new Set<string>();
    for (const appointment of appointments) {
      if (
        appointment.status === EAppointmentStatus.COMPLETED ||
        appointment.status === EAppointmentStatus.CANCELED
      ) {
        continue;
      }

      const appointmentDate = new Date(appointment.dateTime);
      if (!isSameBrazilDay(appointmentDate, referenceDay)) continue;

      const brazilLocal = toBrazilDate(appointmentDate);
      const hour = String(brazilLocal.getUTCHours()).padStart(2, '0');
      const minute = String(brazilLocal.getUTCMinutes()).padStart(2, '0');
      bookedTimes.add(`${hour}:${minute}`);
    }

    const now = new Date();

    return candidateTimes
      .map((time) => {
        const [hour, minute] = time.split(':').map(Number);
        const dateTime = fromBrazilWallClock(year, month, day, hour, minute);
        return { time, dateTime };
      })
      .filter(
        ({ time, dateTime }) =>
          !bookedTimes.has(time) &&
          dateTime.getTime() > now.getTime() &&
          isHealthUnitOpenAt(healthUnit.openingHours, dateTime),
      )
      .map(({ time, dateTime }) => ({
        time,
        dateTime: dateTime.toISOString(),
      }));
  }
}
