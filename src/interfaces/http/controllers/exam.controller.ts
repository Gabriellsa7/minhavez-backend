import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IExamService } from '../../../domain/exam/interfaces/exam.service.interface';
import { IRequestingUser } from '../../../domain/exam/interfaces/exam.service.interface';
import {
  authMiddleware,
  authorize,
  authorizeAdminOrExamProfessional,
  authorizePrincipalTypes,
} from '../middlewary/auth.middleware';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';
import { EPrincipalType } from '../../../domain/auth/interfaces/auth.interface';
import { AppError } from '../../../shared/errors/AppError';
import { IExamUploader } from '../../../domain/exam/interfaces/exam.service.interface';

export class ExamController implements IController {
  router: Router;
  private readonly examService: IExamService;

  constructor(examService: IExamService) {
    this.examService = examService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.post(
      '/exams',
      authMiddleware,
      authorizeAdminOrExamProfessional,
      this.registerExam,
    );
    this.router.get('/exams/:id', authMiddleware, this.getExamById);
    this.router.patch(
      '/exams/:id/download',
      authMiddleware,
      this.downloadExam,
    );
    this.router.get(
      '/patients/:id/exams',
      authMiddleware,
      this.getExamsByPatient,
    );
    this.router.get(
      '/health-units/:id/exams',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.getExamsByHealthUnit,
    );
    this.router.get(
      '/health-professionals/:id/exams',
      authMiddleware,
      authorizePrincipalTypes(EPrincipalType.HEALTH_PROFESSIONAL),
      this.getExamsByProfessional,
    );
  }

  private toRequestingUser(req: Request): IRequestingUser {
    const user = req.user!;
    return {
      sub: user.sub,
      isAdmin:
        user.principalType === EPrincipalType.USER &&
        user.role === EUserRole.ADMIN,
      isHealthProfessional:
        user.principalType === EPrincipalType.HEALTH_PROFESSIONAL,
    };
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

  registerExam = async (req: Request, res: Response): Promise<void> => {
    const {
      patientCpf,
      healthUnitId,
      examType,
      examDate,
      doctorName,
      notes,
      fileBase64,
      fileName,
      mimeType,
      examBookingId,
    } = req.body;

    const uploader: IExamUploader = {
      sub: req.user!.sub,
      name: req.user!.name,
      isExamProfessional:
        req.user!.principalType === EPrincipalType.HEALTH_PROFESSIONAL,
      healthUnitId: req.user!.healthUnitId,
    };

    try {
      const exam = await this.examService.registerExam(
        {
          patientCpf,
          healthUnitId,
          examType,
          examDate: examDate ? new Date(examDate) : null,
          doctorName,
          notes,
          fileBase64,
          fileName,
          mimeType,
          examBookingId,
        },
        uploader,
      );
      res.status(201).json(exam);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getExamById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const exam = await this.examService.getExamForRequester(
        req.params.id,
        this.toRequestingUser(req),
      );
      res.status(200).json(exam);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  downloadExam = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const exam = await this.examService.downloadExamFile(
        req.params.id,
        this.toRequestingUser(req),
      );
      res.status(200).json(exam);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getExamsByPatient = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const exams = await this.examService.listExamsByPatientId(
        req.params.id,
        this.toRequestingUser(req),
      );
      res.status(200).json(exams);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getExamsByHealthUnit = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const exams = await this.examService.listExamsByHealthUnitId(
        req.params.id,
        this.toRequestingUser(req),
      );
      res.status(200).json(exams);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  getExamsByProfessional = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const exams = await this.examService.listExamsByProfessionalId(
        req.params.id,
        this.toRequestingUser(req),
      );
      res.status(200).json(exams);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
