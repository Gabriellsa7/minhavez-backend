import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { HealthUnitService } from '../../../domain/health-unit/service/health-unit.service';

export class HealthUnitController implements IController {
  router: Router;
  private readonly healthUnitService: HealthUnitService;

  constructor(healthUnitService: HealthUnitService) {
    this.healthUnitService = healthUnitService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/health-unit', this.getHealthUnits);
    this.router.get('/health-unit/:id', this.getHealthUnitById);
    this.router.post('/health-unit', this.createHealthUnit);
    this.router.put('/health-unit/:id', this.updateHealthUnit);
    this.router.delete('/health-unit/:id', this.deleteHealthUnit);
  }

  getHealthUnits = async (req: Request, res: Response): Promise<void> => {
    try {
      const healthUnits = await this.healthUnitService.listHealthUnits({});
      res.status(200).json(healthUnits);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getHealthUnitById = async (
    req: Request<{ _id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const healthUnit = await this.healthUnitService.getHealthUnitById(
        req.params._id,
      );
      res.status(200).json(healthUnit);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createHealthUnit = async (req: Request, res: Response): Promise<void> => {
    const { name, address, phone, email } = req.body;
    try {
      const newHealthUnit = await this.healthUnitService.createHealthUnit({
        name,
        address,
        phone,
        email,
      });
      res.status(201).json(newHealthUnit);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  updateHealthUnit = async (
    req: Request<{ _id: string }>,
    res: Response,
  ): Promise<void> => {
    const { _id } = req.params;
    const updateData = req.body;
    try {
      const updatedHealthUnit =
        await this.healthUnitService.updateHealthUnitById(_id, updateData);
      if (!updatedHealthUnit) {
        res.status(404).json({ message: 'Health unit not found' });
        return;
      }
      res.status(200).json(updatedHealthUnit);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  deleteHealthUnit = async (
    req: Request<{ _id: string }>,
    res: Response,
  ): Promise<void> => {
    const { _id } = req.params;
    try {
      const deletedHealthUnit =
        await this.healthUnitService.deleteHealthUnitById(_id);
      if (!deletedHealthUnit) {
        res.status(404).json({ message: 'Health unit not found' });
        return;
      }
      res.status(200).json(deletedHealthUnit);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
