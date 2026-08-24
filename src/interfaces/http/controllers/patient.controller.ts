import { Request, Response, Router } from 'express';
import { PatientService } from '../../../domain/patient/service/patient.service';
import { IController } from './IController';
import {
  authMiddleware,
  authorizeAdminOrExamProfessional,
} from '../middlewary/auth.middleware';
import { normalizeCpf } from '../../../shared/utils/normalizeCpf';
import { AppError } from '../../../shared/errors/AppError';

export class PatientController implements IController {
  router: Router;
  private readonly patientService: PatientService;

  constructor(patientService: PatientService) {
    this.patientService = patientService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/patients', this.getPatients);
    this.router.get('/patients/:id', this.getPatientById);
    this.router.get('/patients/user/:userId', this.getPatientByUserId);
    this.router.get(
      '/patients/cpf/:cpf',
      authMiddleware,
      authorizeAdminOrExamProfessional,
      this.getPatientByCpf,
    );
    this.router.post('/patients', this.createPatient);
    this.router.put('/patients/:id', authMiddleware, this.updatePatient);
    this.router.delete('/patients/:id', this.deletePatient);
    this.router.post(
      '/patients/:id/documents',
      authMiddleware,
      this.uploadMedicalDocument,
    );
    this.router.delete(
      '/patients/:id/documents/:documentId',
      authMiddleware,
      this.removeMedicalDocument,
    );
    this.router.get(
      '/patients/:id/documents/:documentId/download',
      authMiddleware,
      this.downloadMedicalDocument,
    );
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res
        .status(error.status)
        .json({ status: error.status, message: error.message });
      return;
    }
    res.status(500).json({ status: 500, message: (error as Error).message });
  }

  getPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const patients = await this.patientService.listPatients({});
      res.status(200).json(patients);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getPatientById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const patient = await this.patientService.getPatientById(id);
      if (!patient) {
        res.status(404).json({ message: 'Patient not found', status: 404 });
        return;
      }
      res.status(200).json(patient);
    } catch (error) {
      res
        .status(500)
        .json({ message: (error as Error).message, status: 500 });
    }
  };

  getPatientByUserId = async (
    req: Request<{ userId: string }>,
    res: Response,
  ): Promise<void> => {
    const { userId } = req.params;
    try {
      const patient = await this.patientService.getPatientByUserId(userId);
      if (!patient) {
        res.status(404).json({ message: 'Patient not found', status: 404 });
        return;
      }
      res.status(200).json(patient);
    } catch (error) {
      res
        .status(500)
        .json({ message: (error as Error).message, status: 500 });
    }
  };

  getPatientByCpf = async (
    req: Request<{ cpf: string }>,
    res: Response,
  ): Promise<void> => {
    const { cpf } = req.params;
    try {
      const patient = await this.patientService.getPatientByCpf(
        normalizeCpf(cpf),
      );
      if (!patient) {
        res.status(404).json({ message: 'Patient not found', status: 404 });
        return;
      }
      res.status(200).json(patient);
    } catch (error) {
      res
        .status(500)
        .json({ message: (error as Error).message, status: 500 });
    }
  };

  createPatient = async (req: Request, res: Response): Promise<void> => {
    const { userId, cpf, birthDate, priority, phone } = req.body;
    try {
      const newPatient = await this.patientService.createPatient({
        userId,
        cpf,
        birthDate,
        priority,
        phone,
      });
      res.status(201).json(newPatient);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.status).json({
          status: error.status,
          message: error.message,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          errors: [],
        });
        return;
      }
      res.status(500).json({
        status: 500,
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
    }
  };

  updatePatient = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const existingPatient = await this.patientService.getPatientById(id);
      if (!existingPatient) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }
      if (existingPatient.userId !== req.user!.sub) {
        res
          .status(403)
          .json({ message: 'You do not have access to this patient' });
        return;
      }

      const updatedPatient = await this.patientService.updatePatientById(
        id,
        updateData,
      );
      if (!updatedPatient) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }
      res.status(200).json(updatedPatient);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  uploadMedicalDocument = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const { fileBase64, fileName, mimeType } = req.body;
    try {
      const updatedPatient = await this.patientService.uploadMedicalDocument(
        id,
        req.user!.sub,
        { fileBase64, fileName, mimeType },
      );
      res.status(201).json(updatedPatient);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  removeMedicalDocument = async (
    req: Request<{ id: string; documentId: string }>,
    res: Response,
  ): Promise<void> => {
    const { id, documentId } = req.params;
    try {
      const updatedPatient = await this.patientService.removeMedicalDocument(
        id,
        req.user!.sub,
        documentId,
      );
      res.status(200).json(updatedPatient);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  downloadMedicalDocument = async (
    req: Request<{ id: string; documentId: string }>,
    res: Response,
  ): Promise<void> => {
    const { id, documentId } = req.params;
    try {
      const result = await this.patientService.getMedicalDocumentDownloadUrl(
        id,
        req.user!.sub,
        documentId,
      );
      res.status(200).json(result);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  deletePatient = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deletedPatient = await this.patientService.deletePatientById(id);
      if (!deletedPatient) {
        res.status(404).json({ message: 'Patient not found' });
        return;
      }
      res.status(200).json(deletedPatient);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
