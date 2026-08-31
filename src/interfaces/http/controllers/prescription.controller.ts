import { Request, Response, Router, NextFunction } from 'express';
import { IController } from './IController';
import {
  IPrescriptionRequester,
  IPrescriptionService,
} from '../../../domain/prescription/interfaces/prescription.service.interface';
import {
  authMiddleware,
  authorizeAdminOrGeneralHealthProfessional,
} from '../middlewary/auth.middleware';
import { EPrincipalType } from '../../../domain/auth/interfaces/auth.interface';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';
import { EHealthProfessionalType } from '../../../domain/health-professional.ts/interfaces/health-professional.interface';

export class PrescriptionController implements IController {
  router: Router;
  private readonly prescriptionService: IPrescriptionService;

  constructor(prescriptionService: IPrescriptionService) {
    this.prescriptionService = prescriptionService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      '/prescriptions',
      authMiddleware,
      authorizeAdminOrGeneralHealthProfessional,
      this.createPrescription,
    );
    this.router.get(
      '/prescriptions/:id',
      authMiddleware,
      authorizeAdminOrGeneralHealthProfessional,
      this.getPrescriptionById,
    );
    this.router.get(
      '/patients/:patientId/prescriptions',
      authMiddleware,
      this.listPrescriptionsByPatientId,
    );
    this.router.get(
      '/health-professionals/:id/prescriptions',
      authMiddleware,
      authorizeAdminOrGeneralHealthProfessional,
      this.listPrescriptionsByProfessionalId,
    );
  }

  private toRequester(req: Request): IPrescriptionRequester {
    const user = req.user!;
    const isAdmin =
      user.principalType === EPrincipalType.USER && user.role === EUserRole.ADMIN;
    const isGeneralHealthProfessional =
      user.principalType === EPrincipalType.HEALTH_PROFESSIONAL &&
      user.healthProfessionalType === EHealthProfessionalType.GENERAL;

    return {
      sub: user.sub,
      isAdmin,
      isGeneralHealthProfessional,
      healthUnitId: user.healthUnitId,
    };
  }

  createPrescription = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const isAdmin =
        req.user!.principalType === EPrincipalType.USER &&
        req.user!.role === EUserRole.ADMIN;

      const prescription = await this.prescriptionService.createPrescription(
        req.body,
        {
          sub: req.user!.sub,
          isAdmin,
          healthUnitId: req.user!.healthUnitId,
        },
      );
      res.status(201).json(prescription);
    } catch (error) {
      next(error);
    }
  };

  getPrescriptionById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const prescription = await this.prescriptionService.getPrescriptionById(
        req.params.id,
      );
      res.status(200).json(prescription);
    } catch (error) {
      next(error);
    }
  };

  listPrescriptionsByPatientId = async (
    req: Request<{ patientId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const prescriptions =
        await this.prescriptionService.listPrescriptionsByPatientId(
          req.params.patientId,
          this.toRequester(req),
        );
      res.status(200).json(prescriptions);
    } catch (error) {
      next(error);
    }
  };

  listPrescriptionsByProfessionalId = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const isAdmin =
        req.user!.principalType === EPrincipalType.USER &&
        req.user!.role === EUserRole.ADMIN;

      const prescriptions =
        await this.prescriptionService.listPrescriptionsByProfessionalId(
          req.params.id,
          { sub: req.user!.sub, isAdmin, healthUnitId: req.user!.healthUnitId },
        );
      res.status(200).json(prescriptions);
    } catch (error) {
      next(error);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
