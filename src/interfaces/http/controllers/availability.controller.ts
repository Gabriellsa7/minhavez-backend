import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { AvailabilityService } from '../../../domain/availability/service/availability.service';
import { EQueueShift } from '../../../domain/queue/interfaces/queue.interface';
import { AppError } from '../../../shared/errors/AppError';

export class AvailabilityController implements IController {
  router: Router;
  private readonly availabilityService: AvailabilityService;

  constructor(availabilityService: AvailabilityService) {
    this.availabilityService = availabilityService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/health-professionals/:id/available-slots',
      this.getAvailableSlots,
    );
  }

  public getRoutes(): Router {
    return this.router;
  }

  getAvailableSlots = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const date = req.query.date as string | undefined;
    const shift = req.query.shift as EQueueShift | undefined;

    if (!date) {
      res.status(400).json({ message: 'date query parameter is required' });
      return;
    }

    try {
      const slots = await this.availabilityService.getAvailableSlots(
        id,
        date,
        shift,
      );
      res.status(200).json(slots);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      res.status(500).json({ error: (error as Error).message });
    }
  };
}
