import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { HealthProfessionalService } from '../../../domain/health-professional.ts/service/health-professional.service';
import {
  buildPaginatedResponse,
  parsePagination,
} from '../../../shared/utils/pagination';

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
      '/health-professionals/user/:userId',
      this.getHealthProfessionalByUserId,
    );
    this.router.get(
      '/health-professionals/:id',
      this.getHealthProfessionalById,
    );
    this.router.get(
      '/health-professionals/appointment/:appointmentId',
      this.getHealthProfessionalByAppointmentId,
    );
    this.router.post('/health-professionals', this.createHealthProfessional);
    this.router.put('/health-professionals/:id', this.updateHealthProfessional);
    this.router.post(
      '/health-professionals/:id/image',
      this.uploadHealthProfessionalImage,
    );
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
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const specialty =
        typeof req.query.specialty === 'string'
          ? req.query.specialty
          : undefined;
      const pagination = parsePagination({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      });
      const { items, totalItems } =
        await this.healthProfessionalService.listHealthProfessionals(
          specialty ? { specialty } : {},
          search,
          pagination,
        );
      res.status(200).json(buildPaginatedResponse(items, totalItems, pagination));
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

  uploadHealthProfessionalImage = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { imageBase64, fileName, mimeType } = req.body;

    try {
      const updatedHealthProfessional =
        await this.healthProfessionalService.uploadHealthProfessionalImage(id, {
          imageBase64,
          fileName,
          mimeType,
        });

      if (!updatedHealthProfessional) {
        res.status(404).json({ message: 'Health professional not found' });
        return;
      }

      res.status(200).json(updatedHealthProfessional);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message, status: 400 });
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

  getHealthProfessionalByUserId = async (
    req: Request<{ userId: string }>,
    res: Response,
  ): Promise<void> => {
    const { userId } = req.params;
    try {
      const healthProfessional =
        await this.healthProfessionalService.getHealthProfessionalByUserId(
          userId,
        );
      res.status(200).json(healthProfessional);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getHealthProfessionalByAppointmentId = async (
    req: Request<{ appointmentId: string }>,
    res: Response,
  ): Promise<void> => {
    const { appointmentId } = req.params;
    console.log(req.params.appointmentId);
    try {
      const healthProfessional =
        await this.healthProfessionalService.getHealthProfessionalByAppointmentId(
          appointmentId,
        );
      if (!healthProfessional) {
        res.status(404).json({ message: 'Health professional not found' });
        return;
      }
      res.status(200).json(healthProfessional);
    } catch (error) {
      console.error('HealthProfessional Error:', error);

      res.status(500).json({
        error: (error as Error).message,
      });
    }
  };
}
