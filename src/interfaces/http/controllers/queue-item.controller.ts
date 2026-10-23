import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IQueueItemService } from '../../../domain/queue-item/interfaces/queue-item.service.interface';
import {
  IParamsCreateQueueItem,
  IParamsUpdateQueueItem,
} from '../../../domain/queue-item/repository/queue-item.repository.interface';
import { IQueueService } from '../../../domain/queue/interfaces/queue.service.interface';
import {
  authMiddleware,
  authorizeAdminOrExamProfessionalOrReceptionist,
  authorizeAdminOrHealthProfessional,
  authorizePatientOwner,
  authorizeQueueOwner,
  authorizeStaff,
  authorizeUnitStaff,
  isStaff,
} from '../middlewary/auth.middleware';
import { IPatientService } from '../../../domain/patient/interfaces/patient.service.interface';

export class QueueItemController implements IController {
  router: Router;
  private readonly queueItemService: IQueueItemService;
  private readonly queueService: Pick<IQueueService, 'getQueueById'>;
  private readonly patientService: Pick<
    IPatientService,
    'getPatientById' | 'getPatientByUserId'
  >;

  constructor(
    queueItemService: IQueueItemService,
    queueService: Pick<IQueueService, 'getQueueById'>,
    patientService: Pick<
      IPatientService,
      'getPatientById' | 'getPatientByUserId'
    >,
  ) {
    this.queueItemService = queueItemService;
    this.queueService = queueService;
    this.patientService = patientService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/queue-items',
      authMiddleware,
      authorizeStaff,
      this.getQueueItems,
    );
    this.router.get(
      '/queue-items/:id',
      authMiddleware,
      authorizePatientOwner(async (req) => {
        const queueItem = await this.queueItemService
          .getQueueItemById(req.params.id)
          .catch(() => null);
        if (!queueItem) return null;
        return (await this.patientService.getPatientById(queueItem.patientId))
          ?.userId;
      }),
      this.getQueueItemById,
    );
    this.router.get(
      '/queue-items/patient/:patientId',
      authMiddleware,
      authorizePatientOwner(
        async (req) =>
          (await this.patientService.getPatientById(req.params.patientId))
            ?.userId,
      ),
      this.getQueueItemByPatientId,
    );
    this.router.get(
      '/queue-items/professionals/:professionalId',
      authMiddleware,
      authorizeAdminOrHealthProfessional,
      authorizeQueueOwner(async (req) => req.params.professionalId),
      this.getQueueProfissionalById,
    );
    this.router.get(
      '/queue-items/queues/:queueId',
      authMiddleware,
      authorizeUnitStaff(
        async (req) =>
          (
            await this.queueService
              .getQueueById(req.params.queueId)
              .catch(() => null)
          )?.healthUnitId,
        this.isPatientInQueue,
      ),
      this.getQueueItemByQueueId,
    );
    this.router.post(
      '/queue-items',
      authMiddleware,
      authorizeAdminOrHealthProfessional,
      authorizeQueueOwner(
        async (req) =>
          (
            await this.queueService
              .getQueueById(req.body?.queueId)
              .catch(() => null)
          )?.professionalId,
      ),
      this.createQueueItem,
    );
    this.router.put(
      '/queue-items/:id',
      ...this.queueOperatorGuards(),
      this.updateQueueItem,
    );
    this.router.patch(
      '/queue-items/:id/finish',
      ...this.queueOperatorGuards(),
      this.finishQueueItem,
    );
    this.router.patch(
      '/queue-items/:id/absent',
      ...this.queueOperatorGuards(),
      this.markQueueItemAsAbsent,
    );
    this.router.patch(
      '/queue-items/:id/call',
      ...this.queueOperatorGuards(),
      this.callQueueItem,
    );
    this.router.patch(
      '/queue-items/:id/check-in',
      authMiddleware,
      authorizeAdminOrExamProfessionalOrReceptionist,
      this.checkInQueueItem,
    );
    this.router.delete(
      '/queue-items/:id',
      ...this.queueOperatorGuards(),
      this.deleteQueueItem,
    );
  }

  // The app's queue screen counts the other patients from this list, so a patient
  // who is in the queue may read it.
  private isPatientInQueue = async (req: Request): Promise<boolean> => {
    const patient = await this.patientService.getPatientByUserId(req.user!.sub);
    if (!patient) return false;
    const queueItems = await this.queueItemService.listQueueItem({
      queueId: req.params.queueId,
      patientId: patient._id,
    });
    return queueItems.length > 0;
  };

  private queueOperatorGuards() {
    return [
      authMiddleware,
      authorizeAdminOrHealthProfessional,
      authorizeQueueOwner(async (req) => {
        const queueItem = await this.queueItemService.getQueueItemById(
          req.params.id,
        );
        if (!queueItem) return null;
        const queue = await this.queueService.getQueueById(queueItem.queueId);
        return queue?.professionalId;
      }),
    ];
  }

  getQueueItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const queueItems = await this.queueItemService.listQueueItem({});
      res.status(200).json(queueItems);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getQueueItemById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const queueItem = await this.queueItemService.getQueueItemById(id);
      if (!queueItem) {
        res.status(404).json({ message: 'Paciente não encontrado na fila.' });
        return;
      }
      res.status(200).json(queueItem);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getQueueItemByPatientId = async (
    req: Request<{ patientId: string }>,
    res: Response,
  ): Promise<void> => {
    const { patientId } = req.params;
    try {
      const queueItems =
        await this.queueItemService.getQueueItemsByPatientId(patientId);
      res.status(200).json(queueItems);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getQueueItemByQueueId = async (
    req: Request<{ queueId: string }>,
    res: Response,
  ): Promise<void> => {
    const { queueId } = req.params;
    try {
      const queueItem =
        await this.queueItemService.getQueueItemByQueueId(queueId);
      if (!queueItem) {
        res.status(404).json({ message: 'Paciente não encontrado na fila.' });
        return;
      }
      // Patients get only what the queue screen shows about the others.
      res.status(200).json(
        isStaff(req.user!)
          ? queueItem
          : queueItem.map(({ _id, queueId, code, status, position }) => ({
              _id,
              queueId,
              code,
              status,
              position,
            })),
      );
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getQueueProfissionalById = async (
    req: Request<{ professionalId: string }>,
    res: Response,
  ): Promise<void> => {
    const { professionalId } = req.params;
    try {
      const queueItem =
        await this.queueItemService.getQueueItemByProfessionalId(
          professionalId,
        );

      if (!queueItem) {
        res.status(404).json({ message: 'Paciente não encontrado na fila.' });
        return;
      }

      res.status(200).json(queueItem);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createQueueItem = async (req: Request, res: Response): Promise<void> => {
    const data: IParamsCreateQueueItem = req.body;
    try {
      const newQueueItem = await this.queueItemService.createQueueItem(data);
      res.status(201).json(newQueueItem);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  updateQueueItem = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData: IParamsUpdateQueueItem = req.body;
    try {
      const updatedQueueItem = await this.queueItemService.updateQueueItemById(
        id,
        updateData,
      );
      if (!updatedQueueItem) {
        res.status(404).json({ message: 'Paciente não encontrado na fila.' });
        return;
      }
      res.status(200).json(updatedQueueItem);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  finishQueueItem = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const queueItem = await this.queueItemService.finishQueueItem(
        req.params.id,
      );

      res.status(200).json(queueItem);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        status: 400,
      });
    }
  };

  callQueueItem = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const queueItem = await this.queueItemService.callQueueItem(id);

      res.status(200).json(queueItem);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        status: 400,
      });
    }
  };

  checkInQueueItem = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const queueItem = await this.queueItemService.checkInQueueItem(
        req.params.id,
      );

      res.status(200).json(queueItem);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        status: 400,
      });
    }
  };

  markQueueItemAsAbsent = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const queueItem = await this.queueItemService.markQueueItemAsAbsent(
        req.params.id,
      );

      res.status(200).json(queueItem);
    } catch (error) {
      res.status(400).json({
        message: (error as Error).message,
        status: 400,
      });
    }
  };

  deleteQueueItem = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deletedQueueItem =
        await this.queueItemService.deleteQueueItemById(id);
      if (!deletedQueueItem) {
        res.status(404).json({ message: 'Paciente não encontrado na fila.' });
        return;
      }
      res.status(200).json(deletedQueueItem);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
