import { HydratedDocument } from 'mongoose';
import {
  EQueueShift,
  EQueueStatus,
  IQueue,
} from '../../../domain/queue/interfaces/queue.interface';
import { IQueueSchema } from '../../db/mongo/schema/queue.schema';
import {
  IParamsCreateQueue,
  IParamsUpdateQueue,
  IQueueRepository,
} from '../../../domain/queue/repository/queue.repository.interface';
import { MQueue } from '../../db/mongo/models/queue.model';
import { IQueueManagement } from '../../../domain/queue/interfaces/queue-management.interface';
import { EQueueItemStatus } from '../../../domain/queue-item/interfaces/queue-item.interface';

export class QueueRepository implements IQueueRepository {
  private mapToDomain(queueDoc: HydratedDocument<IQueueSchema>): IQueue {
    return {
      _id: queueDoc._id.toString(),
      professionalId: queueDoc.professionalId.toString(),
      healthUnitId: queueDoc.healthUnitId.toString(),
      status: queueDoc.status,
      shift: queueDoc.shift,
      queueDate: queueDoc.queueDate,
      openedAt: queueDoc.openedAt,
      closedAt: queueDoc.closedAt,
      createdAt: queueDoc.createdAt,
      updatedAt: queueDoc.updatedAt,
    };
  }

  async createQueue(queueData: IParamsCreateQueue): Promise<IQueue> {
    try {
      const queueDoc = await MQueue.create(queueData);
      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(`Error creating queue: ${(error as Error).message}`);
    }
  }

  async updateQueueById(
    _id: string,
    params: IParamsUpdateQueue,
  ): Promise<IQueue | null> {
    try {
      const queueDoc = await MQueue.findByIdAndUpdate(_id, params, {
        new: true,
      });

      if (!queueDoc) return null;

      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(`Error updating queue: ${(error as Error).message}`);
    }
  }

  async deleteQueueById(id: string): Promise<IQueue | null> {
    try {
      const queueDoc = await MQueue.findByIdAndDelete(id);

      if (!queueDoc) return null;

      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(`Error deleting queue: ${(error as Error).message}`);
    }
  }

  async getQueueById(id: string): Promise<IQueue | null> {
    try {
      const queueDoc = await MQueue.findById(id);

      if (!queueDoc) return null;

      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(
        `Error retrieving queue by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueByProfessionalId(
    professionalId: string,
  ): Promise<IQueue | null> {
    try {
      const queueDoc = await MQueue.findOne({ professionalId });

      if (!queueDoc) return null;

      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(
        `Error retrieving queue by ID: ${(error as Error).message}`,
      );
    }
  }

  async getQueueManagementByProfessionalId(
    professionalId: string,
  ): Promise<IQueueManagement | null> {
    try {
      const result = await MQueue.aggregate([
        {
          $match: {
            professionalId,
            status: EQueueStatus.OPEN,
          },
        },

        {
          $lookup: {
            from: 'healthprofessionals',
            let: { profId: '$professionalId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: [{ $toString: '$_id' }, '$$profId'] },
                },
              },
              {
                $project: {
                  appointmentDuration: '$schedule.appointmentDuration',
                },
              },
            ],
            as: 'professional',
          },
        },

        {
          $unwind: {
            path: '$professional',
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: 'queueitems',
            localField: '_id',
            foreignField: 'queueId',
            as: 'queueItems',
          },
        },

        {
          $unwind: '$queueItems',
        },

        {
          $match: {
            'queueItems.status': {
              $in: [EQueueItemStatus.WAITING, EQueueItemStatus.IN_SERVICE],
            },
          },
        },

        {
          $sort: {
            'queueItems.position': 1,
          },
        },

        {
          $lookup: {
            from: 'appointments',
            let: { queueItemId: '$queueItems._id' },
            pipeline: [
              {
                $match: { $expr: { $eq: ['$queueItemId', '$$queueItemId'] } },
              },
              {
                $project: { isReturn: 1, returnScheduled: 1 },
              },
            ],
            as: 'appointment',
          },
        },

        {
          $unwind: {
            path: '$appointment',
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: 'patients',
            localField: 'queueItems.patientId',
            foreignField: '_id',
            as: 'patient',
          },
        },

        {
          $unwind: '$patient',
        },

        {
          $lookup: {
            from: 'users',
            localField: 'patient.userId',
            foreignField: '_id',
            as: 'user',
          },
        },

        {
          $unwind: '$user',
        },

        {
          $project: {
            queue: {
              _id: { $toString: '$_id' },
              professionalId: '$professionalId',
              healthUnitId: '$healthUnitId',
              status: '$status',
              shift: '$shift',
              queueDate: '$queueDate',
              openedAt: '$openedAt',
              closedAt: '$closedAt',
              createdAt: '$createdAt',
              updatedAt: '$updatedAt',
            },

            queueItem: {
              _id: { $toString: '$queueItems._id' },
              queueId: { $toString: '$queueItems.queueId' },
              patientId: { $toString: '$queueItems.patientId' },
              code: '$queueItems.code',
              position: '$queueItems.position',
              priority: '$queueItems.priority',
              status: '$queueItems.status',
              checkInTime: '$queueItems.checkInTime',
              calledAt: '$queueItems.calledAt',
              finishedAt: '$queueItems.finishedAt',
              createdAt: '$queueItems.createdAt',
              updatedAt: '$queueItems.updatedAt',
              estimatedWaitMinutes: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ['$queueItems.status', EQueueItemStatus.IN_SERVICE],
                      },
                      then: 0,
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              '$queueItems.status',
                              EQueueItemStatus.WAITING,
                            ],
                          },
                          { $gt: ['$queueItems.position', 0] },
                          { $gt: ['$professional.appointmentDuration', 0] },
                        ],
                      },
                      then: {
                        $multiply: [
                          { $subtract: ['$queueItems.position', 1] },
                          '$professional.appointmentDuration',
                        ],
                      },
                    },
                  ],
                  default: null,
                },
              },
            },

            patient: {
              _id: { $toString: '$patient._id' },
              userId: { $toString: '$patient.userId' },
              cpf: '$patient.cpf',
              birthDate: '$patient.birthDate',
              priority: '$patient.priority',
              phone: '$patient.phone',
              createdAt: '$patient.createdAt',
              updatedAt: '$patient.updatedAt',
            },

            user: {
              _id: { $toString: '$user._id' },
              name: '$user.name',
              email: '$user.email',
              role: '$user.role',
              active: '$user.active',
              createdAt: '$user.createdAt',
            },

            isReturn: { $ifNull: ['$appointment.isReturn', false] },
            returnScheduled: {
              $ifNull: ['$appointment.returnScheduled', false],
            },
          },
        },

        {
          $group: {
            _id: '$queue._id',

            queue: {
              $first: '$queue',
            },

            items: {
              $push: {
                queueItem: '$queueItem',
                patient: '$patient',
                user: '$user',
                isReturn: '$isReturn',
                returnScheduled: '$returnScheduled',
              },
            },
          },
        },

        {
          $project: {
            _id: 0,
            queue: 1,
            items: {
              $filter: {
                input: '$items',
                as: 'item',
                cond: {
                  $eq: ['$$item.queueItem.status', EQueueItemStatus.WAITING],
                },
              },
            },

            currentItem: {
              $first: {
                $filter: {
                  input: '$items',
                  as: 'item',
                  cond: {
                    $eq: [
                      '$$item.queueItem.status',
                      EQueueItemStatus.IN_SERVICE,
                    ],
                  },
                },
              },
            },
          },
        },
      ]);

      if (!result.length) {
        return null;
      }

      return result[0] as IQueueManagement;
    } catch (error) {
      throw new Error(
        `Error retrieving queue management: ${(error as Error).message}`,
      );
    }
  }

  async findOpenQueueByProfessionalIdAndShift(
    professionalId: string,
    shift: EQueueShift,
  ): Promise<IQueue | null> {
    try {
      const queueDoc = await MQueue.findOne({
        professionalId,
        shift,
        status: EQueueStatus.OPEN,
      });

      if (!queueDoc) {
        return null;
      }

      return this.mapToDomain(queueDoc);
    } catch (error) {
      throw new Error(
        `Error retrieving open queue: ${(error as Error).message}`,
      );
    }
  }

  async getQueuesByProfessionalId(professionalId: string): Promise<IQueue[]> {
    try {
      const queueDocs = await MQueue.find({ professionalId }).sort({
        queueDate: -1,
      });

      return queueDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(
        `Error retrieving queues by professional ID: ${(error as Error).message}`,
      );
    }
  }

  async listQueues(filter: Partial<IQueue>): Promise<IQueue[]> {
    try {
      const queueDocs = await MQueue.find(filter);
      return queueDocs.map((doc) => this.mapToDomain(doc));
    } catch (error) {
      throw new Error(`Error listing queues: ${(error as Error).message}`);
    }
  }
}
