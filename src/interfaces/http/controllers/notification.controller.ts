import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { INotificationService } from '../../../domain/notification/interfaces/notification.service.interface';
import { IPatientService } from '../../../domain/patient/interfaces/patient.service.interface';
import {
  IParamsCreateNotification,
  IParamsUpdateNotification,
} from '../../../domain/notification/repository/notification.repository.interface';
import { authMiddleware } from '../middlewary/auth.middleware';

export class NotificationController implements IController {
  router: Router;
  private readonly notificationService: INotificationService;
  private readonly patientService: IPatientService;

  constructor(
    notificationService: INotificationService,
    patientService: IPatientService,
  ) {
    this.notificationService = notificationService;
    this.patientService = patientService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/notifications', authMiddleware, this.getNotifications);
    this.router.get(
      '/notifications/unread',
      authMiddleware,
      this.getUnreadNotifications,
    );
    this.router.get(
      '/notifications/:id',
      authMiddleware,
      this.getNotificationById,
    );
    this.router.post('/notifications', authMiddleware, this.createNotification);
    this.router.put(
      '/notifications/:id',
      authMiddleware,
      this.updateNotification,
    );
    this.router.delete(
      '/notifications/:id',
      authMiddleware,
      this.deleteNotification,
    );
    this.router.delete(
      '/notifications',
      authMiddleware,
      this.clearNotifications,
    );
    this.router.patch(
      '/notifications/:id/read',
      authMiddleware,
      this.markNotificationRead,
    );
    this.router.patch(
      '/notifications/read-all',
      authMiddleware,
      this.markAllNotificationsRead,
    );
  }

  private resolvePatientId = async (
    userId: string,
  ): Promise<string | null> => {
    try {
      const patient = await this.patientService.getPatientByUserId(userId);
      return patient?._id ?? null;
    } catch {
      return null;
    }
  };

  getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = await this.resolvePatientId(req.user!.sub);
      if (!patientId) {
        res.status(200).json([]);
        return;
      }
      const notifications = await this.notificationService.listNotifications(
        { patientId },
      );
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getUnreadNotifications = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const patientId = await this.resolvePatientId(req.user!.sub);
      if (!patientId) {
        res.status(200).json([]);
        return;
      }
      const notifications = await this.notificationService.listNotifications({
        patientId,
        read: false,
      });
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
      const patientId = await this.resolvePatientId(req.user!.sub);
      const notification =
        await this.notificationService.getNotificationById(id);
      if (!notification || !patientId || notification.patientId !== patientId) {
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

  clearNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const patientId = await this.resolvePatientId(req.user!.sub);
      if (!patientId) {
        res.status(200).json({ message: 'Notifications cleared' });
        return;
      }
      const notifications = await this.notificationService.listNotifications({
        patientId,
      });
      await Promise.all(
        notifications.map((notification) =>
          this.notificationService.deleteNotificationById(notification._id),
        ),
      );
      res.status(200).json({ message: 'Notifications cleared' });
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
      const patientId = await this.resolvePatientId(req.user!.sub);
      const notification =
        await this.notificationService.getNotificationById(id);
      if (!notification || !patientId || notification.patientId !== patientId) {
        res.status(404).json({ message: 'Notification not found' });
        return;
      }
      const updatedNotification =
        await this.notificationService.markNotificationRead(id);
      res.status(200).json(updatedNotification);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  markAllNotificationsRead = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const patientId = await this.resolvePatientId(req.user!.sub);
      if (!patientId) {
        res.status(200).json({ message: 'Notifications marked as read' });
        return;
      }
      const unreadNotifications =
        await this.notificationService.listNotifications({
          patientId,
          read: false,
        });
      await Promise.all(
        unreadNotifications.map((notification) =>
          this.notificationService.markNotificationRead(notification._id),
        ),
      );
      res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
