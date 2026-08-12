import { HydratedDocument } from 'mongoose';
import { IExamBookingSchema } from '../../db/mongo/schema/exam-booking.schema';
import { IExamBooking } from '../../../domain/exam-booking/interfaces/exam-booking.interface';
import {
  IExamBookingRepository,
  IListExamBookingsByHealthUnitFilter,
  IParamsCreateExamBooking,
  IParamsUpdateExamBooking,
} from '../../../domain/exam-booking/repository/exam-booking.repository.interface';
import { MExamBooking } from '../../db/mongo/models/exam-booking.model';
import { MExamSlotCounter } from '../../db/mongo/models/exam-slot-counter.model';

export class ExamBookingRepository implements IExamBookingRepository {
  private mapToDomain(
    doc: HydratedDocument<IExamBookingSchema>,
  ): IExamBooking {
    return {
      _id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      healthUnitId: doc.healthUnitId.toString(),
      examOfferingId: doc.examOfferingId.toString(),
      scheduledAt: doc.scheduledAt,
      durationMinutes: doc.durationMinutes,
      priceSnapshot: doc.priceSnapshot,
      status: doc.status,
      slotKey: doc.slotKey,
      resultExamId: doc.resultExamId?.toString() ?? null,
      canceledAt: doc.canceledAt,
      canceledBy: doc.canceledBy,
      cancelReason: doc.cancelReason,
      notes: doc.notes,
      createdByUserId: doc.createdByUserId.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async reserveSlot(
    healthUnitId: string,
    slotKey: string,
    capacity: number,
  ): Promise<boolean> {
    const maxAttempts = 5;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        await MExamSlotCounter.updateOne(
          { healthUnitId, slotKey },
          { $setOnInsert: { capacity, bookedCount: 0 } },
          { upsert: true },
        );
        break;
      } catch (error) {
        const mongoError = error as { code?: number };
        if (mongoError.code === 11000 && attempt < maxAttempts - 1) {
          attempt += 1;
          continue;
        }
        throw new Error(
          `Error initializing exam slot counter: ${(error as Error).message}`,
        );
      }
    }

    const reserved = await MExamSlotCounter.findOneAndUpdate(
      {
        healthUnitId,
        slotKey,
        $expr: { $lt: ['$bookedCount', '$capacity'] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true },
    );

    return !!reserved;
  }

  async releaseSlot(healthUnitId: string, slotKey: string): Promise<void> {
    await MExamSlotCounter.updateOne(
      { healthUnitId, slotKey, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 } },
    );
  }

  async getBookedCountsForSlots(
    healthUnitId: string,
    slotKeys: string[],
  ): Promise<Map<string, { bookedCount: number; capacity: number }>> {
    const docs = await MExamSlotCounter.find({
      healthUnitId,
      slotKey: { $in: slotKeys },
    });

    return new Map(
      docs.map((doc) => [
        doc.slotKey,
        { bookedCount: doc.bookedCount, capacity: doc.capacity },
      ]),
    );
  }

  async createExamBooking(
    data: IParamsCreateExamBooking,
  ): Promise<IExamBooking> {
    try {
      const doc = await MExamBooking.create(data);
      return this.mapToDomain(doc);
    } catch (error) {
      throw new Error(
        `Error creating exam booking: ${(error as Error).message}`,
      );
    }
  }

  async getExamBookingById(id: string): Promise<IExamBooking | null> {
    try {
      const doc = await MExamBooking.findById(id);
      return doc ? this.mapToDomain(doc) : null;
    } catch (error) {
      throw new Error(
        `Error getting exam booking: ${(error as Error).message}`,
      );
    }
  }

  async updateExamBookingById(
    id: string,
    params: IParamsUpdateExamBooking,
  ): Promise<IExamBooking | null> {
    try {
      const doc = await MExamBooking.findByIdAndUpdate(id, params, {
        new: true,
      });
      return doc ? this.mapToDomain(doc) : null;
    } catch (error) {
      throw new Error(
        `Error updating exam booking: ${(error as Error).message}`,
      );
    }
  }

  async listExamBookingsByPatientId(
    patientId: string,
  ): Promise<IExamBooking[]> {
    try {
      const docs = await MExamBooking.find({ patientId }).sort({
        scheduledAt: -1,
      });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing exam bookings by patient: ${(error as Error).message}`,
      );
    }
  }

  async listExamBookingsByHealthUnitId(
    healthUnitId: string,
    filter: IListExamBookingsByHealthUnitFilter,
  ): Promise<IExamBooking[]> {
    try {
      const mongoFilter: Record<string, unknown> = { healthUnitId };

      if (filter.status) {
        mongoFilter.status = filter.status;
      }

      if (filter.date) {
        const start = new Date(
          Date.UTC(
            filter.date.getUTCFullYear(),
            filter.date.getUTCMonth(),
            filter.date.getUTCDate(),
          ),
        );
        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 1);
        mongoFilter.scheduledAt = { $gte: start, $lt: end };
      }

      const docs = await MExamBooking.find(mongoFilter).sort({
        scheduledAt: 1,
      });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing exam bookings by health unit: ${(error as Error).message}`,
      );
    }
  }
}
