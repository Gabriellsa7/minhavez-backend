import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { HealthProfessionalService } from '../../../domain/health-professional.ts/service/health-professional.service';

export class HealthProfessionalController implements IController {
  router: Router;
  private readonly healthProfessionalService: HealthProfessionalService;

  constructor(healthProfessionalService: HealthProfessionalService) {
    this.healthProfessionalService = healthProfessionalService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/health-professionals', this.getHealthProfessionals);
    this.router.get(
      '/health-professionals/:id',
      this.getHealthProfessionalById,
    );
    this.router.post('/health-professionals', this.createHealthProfessional);
    this.router.put('/health-professionals/:id', this.updateHealthProfessional);
    this.router.delete(
      '/health-professionals/:id',
      this.deleteHealthProfessional,
    );
  }

  public getRoutes(): Router {
    return this.router;
  }

  getHealthProfessionals = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const healthProfessionals =
        await this.healthProfessionalService.listHealthProfessionals({});
      res.status(200).json(healthProfessionals);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createHealthProfessional = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const healthProfessional =
        await this.healthProfessionalService.createHealthProfessional(req.body);
      res.status(201).json(healthProfessional);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  updateHealthProfessional = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const healthProfessional =
        await this.healthProfessionalService.updateHealthProfessionalById(
          req.params.id,
          req.body,
        );
      res.status(200).json(healthProfessional);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  deleteHealthProfessional = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      await this.healthProfessionalService.deleteHealthProfessionalById(
        req.params.id,
      );
      res
        .status(200)
        .json({ message: 'Health professional deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getHealthProfessionalById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const healthProfessional =
        await this.healthProfessionalService.getHealthProfessionalById(id);
      if (!healthProfessional) {
        res.status(404).json({ message: 'Health professional not found' });
        return;
      }
      res.status(200).json(healthProfessional);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}
