import '../../../jest/setup-integration-tests';
import { AppointmentRepository } from '../../infrastructure/repository/appointment/appointment.repository';
import { MAppointment } from '../../infrastructure/db/mongo/models/appointment.model';
import { EAppointmentStatus } from '../../domain/appointment/interfaces/appointment.interface';
import { AppError } from '../../shared/errors/AppError';

describe('AppointmentRepository double-booking guard', () => {
  const professionalId = '507f1f77bcf86cd799439011';
  const healthUnitId = '507f1f77bcf86cd799439012';
  const dateTime = new Date('2030-01-01T09:00:00.000Z');

  const bookingFor = (patientId: string) => ({
    patientId,
    professionalId,
    healthUnitId,
    dateTime,
  });

  beforeAll(async () => {
    await MAppointment.init();
  });

  beforeEach(async () => {
    await MAppointment.deleteMany({});
  });

  it('lets exactly one of many concurrent bookings for the same slot succeed', async () => {
    const repository = new AppointmentRepository();
    const patientIds = Array.from(
      { length: 10 },
      (_, index) => `507f1f77bcf86cd7994390${(20 + index).toString()}`,
    );

    const results = await Promise.allSettled(
      patientIds.map((patientId) =>
        repository.createAppointment(bookingFor(patientId)),
      ),
    );

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    expect(fulfilled).toHaveLength(1);
    rejected.forEach((result) => {
      expect(result.reason).toBeInstanceOf(AppError);
      expect((result.reason as AppError).status).toBe(409);
    });
    expect(await MAppointment.countDocuments({ professionalId })).toBe(1);
  });

  it('frees the slot once the existing appointment is canceled', async () => {
    const repository = new AppointmentRepository();
    const first = await repository.createAppointment(
      bookingFor('507f1f77bcf86cd799439030'),
    );

    await repository.updateAppointmentById(first._id, {
      status: EAppointmentStatus.CANCELED,
    });

    await expect(
      repository.createAppointment(bookingFor('507f1f77bcf86cd799439031')),
    ).resolves.toMatchObject({ status: EAppointmentStatus.SCHEDULED });
  });

  it('rejects rescheduling another appointment onto a taken slot', async () => {
    const repository = new AppointmentRepository();
    await repository.createAppointment(bookingFor('507f1f77bcf86cd799439040'));
    const other = await repository.createAppointment({
      ...bookingFor('507f1f77bcf86cd799439041'),
      dateTime: new Date('2030-01-01T10:00:00.000Z'),
    });

    await expect(
      repository.updateAppointmentById(other._id, { dateTime }),
    ).rejects.toMatchObject({ status: 409 });
  });
});
