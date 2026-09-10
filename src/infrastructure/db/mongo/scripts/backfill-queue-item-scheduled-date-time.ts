import 'dotenv/config';
import mongoose, { AnyBulkWriteOperation } from 'mongoose';
import { Logger } from 'traceability';
import { MQueueItem } from '../models/queue-item.model';
import { MAppointment } from '../models/appointment.model';
import { IQueueItemSchema } from '../schema/queue-item.schema';
import { EQueueItemStatus } from '../../../../domain/queue-item/interfaces/queue-item.interface';

const BATCH_SIZE = 200;

async function run(): Promise<void> {
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI is not set');
  }

  await mongoose.connect(databaseUri);
  Logger.info('Backfill: connected to database');

  const cursor = MQueueItem.find({
    status: EQueueItemStatus.WAITING,
    scheduledDateTime: { $exists: false },
  }).cursor();

  let processed = 0;
  let orphaned = 0;
  let batch: AnyBulkWriteOperation<IQueueItemSchema>[] = [];

  for await (const queueItem of cursor) {
    const appointment = await MAppointment.findOne({
      queueItemId: queueItem._id,
    });

    const scheduledDateTime = appointment?.dateTime ?? queueItem.createdAt;

    if (!appointment) {
      orphaned += 1;
      Logger.warn('Backfill: queue item has no linked appointment', {
        queueItemId: queueItem._id.toString(),
      });
    }

    batch.push({
      updateOne: {
        filter: { _id: queueItem._id },
        update: { $set: { scheduledDateTime } },
      },
    });

    if (batch.length >= BATCH_SIZE) {
      await MQueueItem.bulkWrite(batch);
      processed += batch.length;
      batch = [];
      Logger.info('Backfill: batch written', { processed });
    }
  }

  if (batch.length > 0) {
    await MQueueItem.bulkWrite(batch);
    processed += batch.length;
  }

  Logger.info('Backfill: finished', { processed, orphaned });

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    Logger.error('Backfill: failed', { error: (error as Error).message });
    process.exit(1);
  });
