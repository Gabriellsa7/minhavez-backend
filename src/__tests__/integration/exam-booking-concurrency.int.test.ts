import '../../../jest/setup-integration-tests';
import { ExamBookingRepository } from '../../infrastructure/repository/exam-booking/exam-booking.repository';
import { MExamSlotCounter } from '../../infrastructure/db/mongo/models/exam-slot-counter.model';
import { MExamBooking } from '../../infrastructure/db/mongo/models/exam-booking.model';

describe('ExamBookingRepository slot reservation concurrency', () => {
  const healthUnitId = '507f1f77bcf86cd799439011';

  beforeAll(async () => {
    // Mongoose builds indexes in the background after `mongoose.model(...)`
    // is called; without waiting for it here, the concurrent `create()`
    // calls below can race the unique-index build and all succeed, making
    // this very test flaky. `Model.init()` resolves once indexes exist.
    await MExamSlotCounter.init();
  });

  beforeEach(async () => {
    await MExamSlotCounter.deleteMany({});
    await MExamBooking.deleteMany({});
  });

  it('allows exactly `capacity` concurrent reservations to succeed for capacity=1', async () => {
    const repository = new ExamBookingRepository();
    const slotKey = `${healthUnitId}_2030-01-01T09:00:00.000Z`;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        repository.reserveSlot(healthUnitId, slotKey, 1),
      ),
    );

    const successCount = results.filter(Boolean).length;
    expect(successCount).toBe(1);

    const counter = await MExamSlotCounter.findOne({ healthUnitId, slotKey });
    expect(counter?.bookedCount).toBe(1);
  });

  it('allows exactly `capacity` concurrent reservations to succeed for capacity=3', async () => {
    const repository = new ExamBookingRepository();
    const slotKey = `${healthUnitId}_2030-01-01T10:00:00.000Z`;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        repository.reserveSlot(healthUnitId, slotKey, 3),
      ),
    );

    const successCount = results.filter(Boolean).length;
    expect(successCount).toBe(3);

    const counter = await MExamSlotCounter.findOne({ healthUnitId, slotKey });
    expect(counter?.bookedCount).toBe(3);
  });

  it('frees up a seat on release, allowing another reservation', async () => {
    const repository = new ExamBookingRepository();
    const slotKey = `${healthUnitId}_2030-01-01T11:00:00.000Z`;

    const first = await repository.reserveSlot(healthUnitId, slotKey, 1);
    expect(first).toBe(true);

    const secondBeforeRelease = await repository.reserveSlot(
      healthUnitId,
      slotKey,
      1,
    );
    expect(secondBeforeRelease).toBe(false);

    await repository.releaseSlot(healthUnitId, slotKey);

    const thirdAfterRelease = await repository.reserveSlot(
      healthUnitId,
      slotKey,
      1,
    );
    expect(thirdAfterRelease).toBe(true);
  });

  it('rejects a manual duplicate counter document at the database level', async () => {
    const slotKey = `${healthUnitId}_2030-01-01T12:00:00.000Z`;
    await MExamSlotCounter.create({ healthUnitId, slotKey, capacity: 1, bookedCount: 0 });

    await expect(
      MExamSlotCounter.create({
        healthUnitId,
        slotKey,
        capacity: 1,
        bookedCount: 0,
      }),
    ).rejects.toThrow();
  });
});
