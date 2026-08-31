import { HydratedDocument } from 'mongoose';
import { IPrescriptionSchema } from '../../db/mongo/schema/prescription.schema';
import {
  IPrescription,
  IPrescriptionExam,
} from '../../../domain/prescription/interfaces/prescription.interface';
import {
  IParamsCreatePrescription,
  IPrescriptionRepository,
} from '../../../domain/prescription/repository/prescription.repository.interface';
import { MPrescription } from '../../db/mongo/models/prescription.model';

export class PrescriptionRepository implements IPrescriptionRepository {
  private mapToDomain(doc: HydratedDocument<IPrescriptionSchema>): IPrescription {
    return {
      _id: doc._id.toString(),
      patientId: doc.patientId.toString(),
      professionalId: doc.professionalId.toString(),
      healthUnitId: doc.healthUnitId.toString(),
      queueItemId: doc.queueItemId ? doc.queueItemId.toString() : null,
      medications: doc.medications,
      observations: doc.observations,
      exams: doc.exams.map(
        (exam): IPrescriptionExam => ({
          examOfferingId: exam.examOfferingId.toString(),
          examOfferingName: exam.examOfferingName,
        }),
      ),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async create(data: IParamsCreatePrescription): Promise<IPrescription> {
    try {
      const doc = await MPrescription.create(data);
      return this.mapToDomain(doc);
    } catch (error) {
      throw new Error(
        `Error creating prescription: ${(error as Error).message}`,
      );
    }
  }

  async findById(id: string): Promise<IPrescription | null> {
    try {
      const doc = await MPrescription.findById(id);
      return doc ? this.mapToDomain(doc) : null;
    } catch (error) {
      throw new Error(
        `Error getting prescription: ${(error as Error).message}`,
      );
    }
  }

  async findByPatientId(patientId: string): Promise<IPrescription[]> {
    try {
      const docs = await MPrescription.find({ patientId }).sort({
        createdAt: -1,
      });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing prescriptions: ${(error as Error).message}`,
      );
    }
  }

  async findByProfessionalId(professionalId: string): Promise<IPrescription[]> {
    try {
      const docs = await MPrescription.find({ professionalId }).sort({
        createdAt: -1,
      });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error listing prescriptions: ${(error as Error).message}`,
      );
    }
  }

  async existsForQueueItemId(queueItemId: string): Promise<boolean> {
    try {
      const doc = await MPrescription.exists({ queueItemId });
      return Boolean(doc);
    } catch (error) {
      throw new Error(
        `Error checking prescription existence: ${(error as Error).message}`,
      );
    }
  }
}
