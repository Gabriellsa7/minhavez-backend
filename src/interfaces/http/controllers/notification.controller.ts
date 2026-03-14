import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { INotificationService } from '../../../domain/notification/interfaces/notification.service.interface';
import {
  IParamsCreateNotification,
  IParamsUpdateNotification,
} from '../../../domain/notification/repository/notification.repository.interface';

export class NotificationController implements IController {
  router: Router;
  private readonly notificationService: INotificationService;

  constructor(notificationService: INotificationService) {
    this.notificationService = notificationService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/notifications', this.getNotifications);
    this.router.get('/notifications/:id', this.getNotificationById);
    this.router.post('/notifications', this.createNotification);
    this.router.put('/notifications/:id', this.updateNotification);
    this.router.delete('/notifications/:id', this.deleteNotification);
    this.router.post('/notifications/:id/read', this.markNotificationRead);
  }

  getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const notifications = await this.notificationService.listNotifications(
        {},
      );
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getNotificationById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const notification =
        await this.notificationService.getNotificationById(id);
      if (!notification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      res.status(200).json(notification);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createNotification = async (req: Request, res: Response): Promise<void> => {
    const data: IParamsCreateNotification = req.body;
    try {
      const newNotification =
        await this.notificationService.createNotification(data);
      res.status(201).json(newNotification);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  updateNotification = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData: IParamsUpdateNotification = {
      notificationData: req.body,
    };
    try {
      const updatedNotification =
        await this.notificationService.updateNotificationById(id, updateData);
      if (!updatedNotification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      res.status(200).json(updatedNotification);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  deleteNotification = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deletedNotification =
        await this.notificationService.deleteNotificationById(id);
      if (!deletedNotification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      res.status(200).json(deletedNotification);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  markNotificationRead = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const updatedNotification =
        await this.notificationService.markNotificationRead(id);
      if (!updatedNotification) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      res.status(200).json(updatedNotification);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
