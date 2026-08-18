import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { HealthUnitService } from '../../../domain/health-unit/service/health-unit.service';
import { IHealthUnit } from '../../../domain/health-unit/interfaces/health-unit.interface';
import { authMiddleware, authorize } from '../middlewary/auth.middleware';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';

export class HealthUnitController implements IController {
  router: Router;
  private readonly healthUnitService: HealthUnitService;

  constructor(healthUnitService: HealthUnitService) {
    this.healthUnitService = healthUnitService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/health-units', this.getHealthUnits);
    this.router.get('/health-units/user/:userId', this.getHealthUnitsByUserId);
    this.router.get('/health-units/:id', this.getHealthUnitById);
    this.router.post(
      '/health-units',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.createHealthUnit,
    );
    this.router.put(
      '/health-units/:id',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.updateHealthUnit,
    );
    this.router.post(
      '/health-units/:id/image',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.uploadHealthUnitImage,
    );
    this.router.delete(
      '/health-units/:id',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.deleteHealthUnit,
    );
  }

  getHealthUnits = async (req: Request, res: Response): Promise<void> => {
    try {
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const healthUnits = await this.healthUnitService.listHealthUnits(
        {},
        search,
      );
      res.status(200).json(healthUnits);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getHealthUnitsByUserId = async (
    req: Request<{ userId: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const healthUnits = await this.healthUnitService.getHealthUnitsByUserId(
        req.params.userId,
      );
      res.status(200).json(healthUnits);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getHealthUnitById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const healthUnit = await this.healthUnitService.getHealthUnitById(
        req.params.id,
      );
      res.status(200).json(healthUnit);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createHealthUnit = async (req: Request, res: Response): Promise<void> => {
    const {
      userId,
      name,
      address,
      phone,
      description,
      services,
      email,
      img,
      openingHours,
      unitType,
    } = req.body;
    try {
      const newHealthUnit = await this.healthUnitService.createHealthUnit({
        userId,
        name,
        address,
        phone,
        description,
        services,
        openingHours,
        email,
        img,
        unitType,
      });
      res.status(201).json(newHealthUnit);
    } catch (error) {
      console.error(error);

      res.status(400).json({
        message: (error as Error).message,
        status: 400,
        errors: [],
      });
    }
  };

  updateHealthUnit = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body as Partial<IHealthUnit>;
    try {
      const updatedHealthUnit =
        await this.healthUnitService.updateHealthUnitById(id, updateData);
      if (!updatedHealthUnit) {
        res.status(404).json({ message: 'Health unit not found' });
        return;
      }
      res.status(200).json(updatedHealthUnit);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  uploadHealthUnitImage = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { imageBase64, fileName, mimeType } = req.body;

    try {
      const updatedHealthUnit =
        await this.healthUnitService.uploadHealthUnitImage(id, {
          imageBase64,
          fileName,
          mimeType,
        });

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
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deletedHealthUnit =
        await this.healthUnitService.deleteHealthUnitById(id);
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
