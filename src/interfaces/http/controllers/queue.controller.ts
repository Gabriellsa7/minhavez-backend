import { Request, Response, Router, NextFunction } from 'express';
import { IController } from './IController';
import { IQueueService } from '../../../domain/queue/interfaces/queue.service.interface';
import { IParamsCreateQueue } from '../../../domain/queue/repository/queue.repository.interface';
import {
  authMiddleware,
  authorizeAdminOrHealthProfessional,
  authorizePatientOwner,
  authorizeQueueOwner,
} from '../middlewary/auth.middleware';
import { IPatientService } from '../../../domain/patient/interfaces/patient.service.interface';

export class QueueController implements IController {
  router: Router;
  private readonly queueService: IQueueService;
  private readonly patientService: Pick<IPatientService, 'getPatientById'>;

  constructor(
    queueService: IQueueService,
    patientService: Pick<IPatientService, 'getPatientById'>,
  ) {
    this.queueService = queueService;
    this.patientService = patientService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/queues', this.getQueue);
    this.router.get('/queues/:id', this.getQueueById);
    this.router.get('/queues/patient/:patientId', this.getQueueByPatientId);
    this.router.get(
      '/queues/patient/:patientId/details',
      authMiddleware,
      authorizePatientOwner(
        async (req) =>
          (await this.patientService.getPatientById(req.params.patientId))
            ?.userId,
      ),
      this.getQueuesWithDetailsByPatientId,
    );
    this.router.get(
      '/queue/professional/:professionalId',
      this.getQueueByProfessionalId,
    );
    this.router.get(
      '/queue/professional/:professionalId/management',
      this.getQueueManagementByProfessionalId,
    );
    this.router.get(
      '/queue/professional/:professionalId/history',
      this.getQueueHistoryByProfessionalId,
    );
    this.router.post(
      '/queues',
      authMiddleware,
      authorizeAdminOrHealthProfessional,
      authorizeQueueOwner(async (req) => req.body?.professionalId),
      this.createQueue,
    );
    this.router.delete(
      '/queues/:id',
      ...this.queueWriteGuards(),
      this.deleteQueueById,
    );
    this.router.patch(
      '/queues/:id/open',
      ...this.queueWriteGuards(),
      this.openQueue,
    );
    this.router.patch(
      '/queues/:id/close',
      ...this.queueWriteGuards(),
      this.closeQueue,
    );
    this.router.get(
      '/queues/professional/:professionalId',
      this.getQueuesByProfessionalId,
    );
    this.router.put(
      '/queues/:id',
      ...this.queueWriteGuards(),
      this.updateQueueById,
    );
    this.router.get(
      '/health-units/:id/queue-summary',
      this.getHealthUnitQueueSummary,
    );
  }

  private queueWriteGuards() {
    return [
      authMiddleware,
      authorizeAdminOrHealthProfessional,
      authorizeQueueOwner(async (req) => {
        const queue = await this.queueService.getQueueById(req.params.id);
        return queue?.professionalId;
      }),
    ];
  }

  getQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      const queue = await this.queueService.listQueues({});
      res.status(200).json(queue);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getQueueByPatientId = async (
    req: Request<{ patientId: string }>,
    res: Response,
  ): Promise<void> => {
    const { patientId } = req.params;
    try {
      const queues = await this.queueService.getQueuesByPatientId(patientId);
      res.status(200).json(queues);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getQueuesWithDetailsByPatientId = async (
    req: Request<{ patientId: string }>,
    res: Response,
  ): Promise<void> => {
    const { patientId } = req.params;
    try {
      const queues =
        await this.queueService.getQueuesWithDetailsByPatientId(patientId);
      res.status(200).json(queues);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getQueueById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const queueItem = await this.queueService.getQueueById(id);
      if (!queueItem) {
        res.status(404).json({ message: 'Queue item not found' });
        return;
      }
      res.status(200).json(queueItem);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createQueue = async (req: Request, res: Response): Promise<void> => {
    const data: IParamsCreateQueue = req.body;
    try {
      const newQueueItem = await this.queueService.createQueue({
        professionalId: data.professionalId,
        healthUnitId: data.healthUnitId,
        status: data.status,
      });

      res.status(201).json(newQueueItem);
    } catch (error) {
      console.error('CREATE QUEUE ERROR:', error);

      res.status(400).json({
        message: (error as Error).message,
        status: 400,
        errors: error,
      });
    }
  };

  deleteQueueById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deletedQueueItem = await this.queueService.deleteQueueById(id);

      if (!deletedQueueItem) {
        res.status(404).json({ message: 'Queue not found' });
        return;
      }

      res.status(200).json({
        message: 'Queue deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        message: (error as Error).message || 'Internal server error',
      });
    }
  };

  getQueueByProfessionalId = async (
    req: Request<{ professionalId: string }>,
    res: Response,
  ): Promise<void> => {
    const { professionalId } = req.params;

    try {
      const queue =
        await this.queueService.getQueueByProfessionalId(professionalId);

      if (!queue) {
        res.status(404).json({ message: 'Queue not found' });
        return;
      }

      res.status(200).json(queue);
    } catch (error) {
      res.status(500).json({
        message: (error as Error).message || 'Internal server error',
      });
    }
  };

  getQueueManagementByProfessionalId = async (
    req: Request<{ professionalId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const { professionalId } = req.params;

    try {
      const queueManagement =
        await this.queueService.getQueueManagementByProfessionalId(
          professionalId,
        );

      res.status(200).json(queueManagement);
    } catch (error) {
      next(error);
    }
  };

  getQueueHistoryByProfessionalId = async (
    req: Request<{ professionalId: string }>,
    res: Response,
  ): Promise<void> => {
    const { professionalId } = req.params;
    const { startDate, endDate } = req.query;

    try {
      const history = await this.queueService.getQueueHistoryByProfessionalId(
        professionalId,
        {
          startDate:
            typeof startDate === 'string' && startDate
              ? new Date(startDate)
              : undefined,
          endDate:
            typeof endDate === 'string' && endDate
              ? new Date(endDate)
              : undefined,
        },
      );

      res.status(200).json(history);
    } catch (error) {
      res.status(500).json({
        message: (error as Error).message,
      });
    }
  };

  updateQueueById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const updatedQueueItem = await this.queueService.updateQueueById(
        id,
        updateData,
      );
      if (!updatedQueueItem) {
        res.status(404).json({ message: 'Queue item not found' });
        return;
      }
      res.status(200).json(updatedQueueItem);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  openQueue = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;

    try {
      const queue = await this.queueService.openQueue(id);

      res.status(200).json(queue);
    } catch (error) {
      res.status(400).json({
        status: 400,
        message: (error as Error).message,
      });
    }
  };

  closeQueue = async (
    req: Request<{ id: string }, unknown, { reason?: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { reason } = req.body ?? {};

    try {
      const queue = await this.queueService.closeQueue(id, reason);

      res.status(200).json(queue);
    } catch (error) {
      res.status(400).json({
        status: 400,
        message: (error as Error).message,
      });
    }
  };

  getQueuesByProfessionalId = async (
    req: Request<{ professionalId: string }>,
    res: Response,
  ): Promise<void> => {
    const { professionalId } = req.params;

    try {
      const queues =
        await this.queueService.getQueuesByProfessionalId(professionalId);

      res.status(200).json(queues);
    } catch (error) {
      res.status(500).json({
        message: (error as Error).message,
      });
    }
  };

  getHealthUnitQueueSummary = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;

    try {
      const summary = await this.queueService.getHealthUnitQueueSummary(id);
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getRoutes(): Router {
    return this.router;
  }
}
