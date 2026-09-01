import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IExamOfferingService } from '../../../domain/exam-offering/interfaces/exam-offering.service.interface';
import { authMiddleware, authorize } from '../middlewary/auth.middleware';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';
import { AppError } from '../../../shared/errors/AppError';

export class ExamOfferingController implements IController {
  router: Router;
  private readonly examOfferingService: IExamOfferingService;

  constructor(examOfferingService: IExamOfferingService) {
    this.examOfferingService = examOfferingService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      '/health-units/:id/exam-offerings',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.createExamOffering,
    );
    this.router.get(
      '/health-units/:id/exam-offerings',
      authMiddleware,
      this.listExamOfferings,
    );
    this.router.get(
      '/exam-offerings/search',
      authMiddleware,
      this.searchExamOfferingsByName,
    );
    this.router.get(
      '/exam-offerings/:id',
      authMiddleware,
      this.getExamOfferingById,
    );
    this.router.patch(
      '/exam-offerings/:id',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.updateExamOffering,
    );
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }

  createExamOffering = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const offering = await this.examOfferingService.createExamOffering(
        { ...req.body, healthUnitId: req.params.id },
        req.user!.sub,
      );
      res.status(201).json(offering);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  updateExamOffering = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const offering = await this.examOfferingService.updateExamOffering(
        req.params.id,
        req.body,
        req.user!.sub,
      );
      res.status(200).json(offering);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getExamOfferingById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const offering = await this.examOfferingService.getExamOfferingById(
        req.params.id,
      );
      res.status(200).json(offering);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  searchExamOfferingsByName = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const name = typeof req.query.name === 'string' ? req.query.name : '';
      const offerings =
        await this.examOfferingService.listClinicsOfferingExam(name);
      res.status(200).json(offerings);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  listExamOfferings = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const offerings =
        await this.examOfferingService.listExamOfferingsByHealthUnitId(
          req.params.id,
          req.user?.sub,
          includeInactive,
        );
      res.status(200).json(offerings);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
