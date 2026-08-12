import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IExamAvailabilityService } from '../../../domain/exam-availability/interfaces/exam-availability.service.interface';
import { authMiddleware, authorize } from '../middlewary/auth.middleware';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';
import { AppError } from '../../../shared/errors/AppError';

export class ExamAvailabilityController implements IController {
  router: Router;
  private readonly examAvailabilityService: IExamAvailabilityService;

  constructor(examAvailabilityService: IExamAvailabilityService) {
    this.examAvailabilityService = examAvailabilityService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.put(
      '/health-units/:id/exam-availability-rules',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.upsertRules,
    );
    this.router.get(
      '/health-units/:id/exam-availability-rules',
      authMiddleware,
      this.listRules,
    );
    this.router.post(
      '/health-units/:id/exam-availability-blackouts',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.addBlackout,
    );
    this.router.delete(
      '/exam-availability-blackouts/:id',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.removeBlackout,
    );
    this.router.get(
      '/health-units/:id/exam-availability-blackouts',
      authMiddleware,
      this.listBlackouts,
    );
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }

  upsertRules = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const rules = await this.examAvailabilityService.upsertRules(
        req.params.id,
        req.body.rules ?? [],
        req.user!.sub,
      );
      res.status(200).json(rules);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  listRules = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const rules = await this.examAvailabilityService.listRulesByHealthUnitId(
        req.params.id,
      );
      res.status(200).json(rules);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  addBlackout = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const blackout = await this.examAvailabilityService.addBlackout(
        req.params.id,
        new Date(req.body.date),
        req.body.reason,
        req.user!.sub,
      );
      res.status(201).json(blackout);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  removeBlackout = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      await this.examAvailabilityService.removeBlackout(
        req.params.id,
        req.user!.sub,
      );
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error);
    }
  };

  listBlackouts = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const blackouts =
        await this.examAvailabilityService.listBlackoutsByHealthUnitId(
          req.params.id,
        );
      res.status(200).json(blackouts);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
