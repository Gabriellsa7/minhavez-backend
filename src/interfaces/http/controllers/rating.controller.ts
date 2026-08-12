import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IRatingService } from '../../../domain/rating/interfaces/rating.service.interface';

export class RatingController implements IController {
  router: Router;
  private readonly ratingService: IRatingService;

  constructor(ratingService: IRatingService) {
    this.ratingService = ratingService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/appointments/:id/rating-eligibility',
      this.getRatingEligibility,
    );
    this.router.post('/appointments/:id/ratings', this.submitRating);
    this.router.get(
      '/health-professionals/:id/rating-summary',
      this.getProfessionalRatingSummary,
    );
    this.router.get(
      '/health-units/:id/rating-summary',
      this.getHealthUnitRatingSummary,
    );
  }

  getRatingEligibility = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const eligibility = await this.ratingService.getRatingEligibility(id);
      res.status(200).json(eligibility);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  submitRating = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const rating = await this.ratingService.submitRating(id, req.body);
      res.status(201).json(rating);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  getProfessionalRatingSummary = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const summary = await this.ratingService.getProfessionalRatingSummary(
        id,
      );
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getHealthUnitRatingSummary = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const summary = await this.ratingService.getHealthUnitRatingSummary(id);
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
