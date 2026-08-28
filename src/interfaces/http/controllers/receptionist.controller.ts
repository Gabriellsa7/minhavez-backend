import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { ReceptionistService } from '../../../domain/receptionist/service/receptionist.service';
import { authMiddleware, authorize } from '../middlewary/auth.middleware';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';
import { AppError } from '../../../shared/errors/AppError';

export class ReceptionistController implements IController {
  router: Router;
  private readonly receptionistService: ReceptionistService;

  constructor(receptionistService: ReceptionistService) {
    this.receptionistService = receptionistService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/receptionists/health-unit/:healthUnitId',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.getReceptionistsByHealthUnitId,
    );
    this.router.get(
      '/receptionists/:id',
      authMiddleware,
      this.getReceptionistById,
    );
    this.router.post(
      '/receptionists',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.createReceptionist,
    );
    this.router.put(
      '/receptionists/:id',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.updateReceptionist,
    );
    this.router.delete(
      '/receptionists/:id',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.deleteReceptionist,
    );
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.status).json({ status: error.status, message: error.message });
      return;
    }
    res.status(500).json({ status: 500, message: (error as Error).message });
  }

  getReceptionistsByHealthUnitId = async (
    req: Request<{ healthUnitId: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const receptionists =
        await this.receptionistService.listReceptionistsByHealthUnitId(
          req.params.healthUnitId,
        );
      res.status(200).json(receptionists);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getReceptionistById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const receptionist = await this.receptionistService.getReceptionistById(
        req.params.id,
      );
      res.status(200).json(receptionist);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  createReceptionist = async (req: Request, res: Response): Promise<void> => {
    try {
      const receptionist = await this.receptionistService.createReceptionist(
        req.body,
      );
      res.status(201).json(receptionist);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateReceptionist = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const receptionist = await this.receptionistService.updateReceptionistById(
        req.params.id,
        req.body,
      );
      res.status(200).json(receptionist);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  deleteReceptionist = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      await this.receptionistService.deleteReceptionistById(req.params.id);
      res.status(200).json({ message: 'Receptionist deleted successfully' });
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
