import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IQueueItemService } from '../../../domain/queue-item/interfaces/queue-item.service.interface';
import {
  IParamsCreateQueueItem,
  IParamsUpdateQueueItem,
} from '../../../domain/queue-item/repository/queue-item.repository.interface';

export class QueueItemController implements IController {
  router: Router;
  private readonly queueItemService: IQueueItemService;

  constructor(queueItemService: IQueueItemService) {
    this.queueItemService = queueItemService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/queue-items', this.getQueueItems);
    this.router.get('/queue-items/:id', this.getQueueItemById);
    this.router.get(
      '/queue-items/patient/:patientId',
      this.getQueueItemByPatientId,
    );
    this.router.get('/queue-items/queue/:queueId', this.getQueueItemByQueueId);
    this.router.post('/queue-items', this.createQueueItem);
    this.router.put('/queue-items/:id', this.updateQueueItem);
    this.router.delete('/queue-items/:id', this.deleteQueueItem);
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
        res.status(404).json({ message: 'Queue item not found' });
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
      const queueItem =
        await this.queueItemService.getQueueItemByPatientId(patientId);
      if (!queueItem) {
        res.status(404).json({ message: 'Queue item not found' });
        return;
      }
      res.status(200).json(queueItem);
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
        res.status(404).json({ message: 'Queue item not found' });
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
    const updateData: IParamsUpdateQueueItem = { queueItemData: req.body };
    try {
      const updatedQueueItem = await this.queueItemService.updateQueueItemById(
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

  deleteQueueItem = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deletedQueueItem =
        await this.queueItemService.deleteQueueItemById(id);
      if (!deletedQueueItem) {
        res.status(404).json({ message: 'Queue item not found' });
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
