import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IQueueService } from '../../../domain/queue/interfaces/queue.service.interface';
import { IParamsCreateQueue } from '../../../domain/queue/repository/queue.repository.interface';

export class QueueController implements IController {
  router: Router;
  private readonly queueService: IQueueService;

  constructor(queueService: IQueueService) {
    this.queueService = queueService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/queues', this.getQueue);
    this.router.get('/queues/:id', this.getQueueById);
    this.router.post('/queues', this.createQueue);
    this.router.delete('/queues/:id', this.deleteQueueById);
    this.router.put('/queues/:id', this.updateQueueById);
  }

  getQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      const queue = await this.queueService.listQueues();
      res.status(200).json(queue);
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
        type: data.type,
      });
      console.warn(newQueueItem);
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
        res.status(404).json({ message: 'Queue item not found' });
        return;
      }
      res.status(200).json(deletedQueueItem);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  updateQueueById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const updatedQueueItem = await this.queueService.updateQueueById(id, {
        queueData: updateData,
      });
      if (!updatedQueueItem) {
        res.status(404).json({ message: 'Queue item not found' });
        return;
      }
      res.status(200).json(updatedQueueItem);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  getRoutes(): Router {
    return this.router;
  }
}
