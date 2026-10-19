import 'dotenv/config';
import mongoose from 'mongoose';
import { Logger } from 'traceability';
import { MPatient } from '../models/patient.model';
import { MQueueItem } from '../models/queue-item.model';
import { EPatientPriority } from '../../../../domain/patient/interfaces/patient.interface';
import {
  EQueueItemPriority,
  EQueueItemStatus,
} from '../../../../domain/queue-item/interfaces/queue-item.interface';

// CHRONIC_CONDITION is no longer a queue priority (only the legal categories are).
// Patients that still carry it become NORMAL, and their waiting queue items lose the
// priority they got from it.
const REMOVED_PRIORITY = 'CHRONIC_CONDITION';

async function run(): Promise<void> {
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI is not set');
  }

  await mongoose.connect(databaseUri);
  Logger.info('Migration: connected to database');

  const patients = await MPatient.collection
    .find({ priority: REMOVED_PRIORITY }, { projection: { _id: 1 } })
    .toArray();
  const patientIds = patients.map((patient) => patient._id);

  const patientResult = await MPatient.collection.updateMany(
    { _id: { $in: patientIds } },
    { $set: { priority: EPatientPriority.NORMAL } },
  );

  const queueItemResult = await MQueueItem.updateMany(
    {
      patientId: { $in: patientIds },
      status: EQueueItemStatus.WAITING,
      priority: EQueueItemPriority.HIGH,
    },
    { $set: { priority: EQueueItemPriority.MEDIUM } },
  );

  Logger.info('Migration: finished', {
    patientsUpdated: patientResult.modifiedCount,
    waitingQueueItemsUpdated: queueItemResult.modifiedCount,
  });

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    Logger.error('Migration: failed', { error: (error as Error).message });
    process.exit(1);
  });
