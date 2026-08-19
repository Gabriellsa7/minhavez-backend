import { Request, Response, Router } from 'express';
import { IController } from './IController';
import {
  IExamBookingRequester,
  IExamBookingService,
} from '../../../domain/exam-booking/interfaces/exam-booking.service.interface';
import { EExamBookingStatus } from '../../../domain/exam-booking/interfaces/exam-booking.interface';
import {
  authMiddleware,
  authorize,
  authorizeAdminOrHealthProfessional,
} from '../middlewary/auth.middleware';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';
import { EPrincipalType } from '../../../domain/auth/interfaces/auth.interface';
import { EHealthProfessionalType } from '../../../domain/health-professional.ts/interfaces/health-professional.interface';
import { AppError } from '../../../shared/errors/AppError';
import {
  buildPaginatedResponse,
  parsePagination,
} from '../../../shared/utils/pagination';

export class ExamBookingController implements IController {
  router: Router;
  private readonly examBookingService: IExamBookingService;

  constructor(examBookingService: IExamBookingService) {
    this.examBookingService = examBookingService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/health-units/:id/exam-slots',
      authMiddleware,
      this.getAvailableSlots,
    );
    this.router.post(
      '/exam-bookings',
      authMiddleware,
      authorize(EUserRole.USER),
      this.createBooking,
    );
    this.router.get(
      '/exam-bookings/:id',
      authMiddleware,
      this.getBookingById,
    );
    this.router.get(
      '/patients/:id/exam-bookings',
      authMiddleware,
      this.listBookingsByPatient,
    );
    this.router.get(
      '/health-units/:id/exam-bookings',
      authMiddleware,
      authorizeAdminOrHealthProfessional,
      this.listBookingsByHealthUnit,
    );
    this.router.patch(
      '/exam-bookings/:id/cancel',
      authMiddleware,
      this.cancelBooking,
    );
    this.router.patch(
      '/exam-bookings/:id/reschedule',
      authMiddleware,
      authorize(EUserRole.USER),
      this.rescheduleBooking,
    );
    this.router.patch(
      '/exam-bookings/:id/status',
      authMiddleware,
      authorizeAdminOrHealthProfessional,
      this.updateStatus,
    );
    this.router.patch(
      '/exam-bookings/:id/link-result',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.linkResultExam,
    );
  }

  private toRequester(req: Request): IExamBookingRequester {
    const user = req.user!;
    const isHealthProfessional =
      user.principalType === EPrincipalType.HEALTH_PROFESSIONAL;

    return {
      sub: user.sub,
      isAdmin:
        user.principalType === EPrincipalType.USER &&
        user.role === EUserRole.ADMIN,
      isExamProfessional:
        isHealthProfessional &&
        user.healthProfessionalType === EHealthProfessionalType.EXAM_PROFESSIONAL,
      healthUnitId: isHealthProfessional ? user.healthUnitId : undefined,
    };
  }

  private handleError(req: Request, res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.status).json({
        status: error.status,
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
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

  getAvailableSlots = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const date = new Date(req.query.date as string);
      const slots = await this.examBookingService.getAvailableSlots(
        req.params.id,
        date,
      );
      res.status(200).json({ date: req.query.date, slots });
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  createBooking = async (req: Request, res: Response): Promise<void> => {
    try {
      const booking = await this.examBookingService.createBooking(
        {
          healthUnitId: req.body.healthUnitId,
          examOfferingId: req.body.examOfferingId,
          scheduledAt: new Date(req.body.scheduledAt),
          notes: req.body.notes,
        },
        this.toRequester(req),
      );
      res.status(201).json(booking);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  getBookingById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const booking = await this.examBookingService.getBookingById(
        req.params.id,
        this.toRequester(req),
      );
      res.status(200).json(booking);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  listBookingsByPatient = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const pagination = parsePagination({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      });
      const { items, totalItems } =
        await this.examBookingService.listBookingsByPatientId(
          req.params.id,
          this.toRequester(req),
          pagination,
        );
      res.status(200).json(buildPaginatedResponse(items, totalItems, pagination));
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  listBookingsByHealthUnit = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const bookings = await this.examBookingService.listBookingsByHealthUnitId(
        req.params.id,
        this.toRequester(req),
        {
          date: req.query.date ? new Date(req.query.date as string) : undefined,
          startDate: req.query.startDate
            ? new Date(req.query.startDate as string)
            : undefined,
          endDate: req.query.endDate
            ? new Date(req.query.endDate as string)
            : undefined,
          status: req.query.status as EExamBookingStatus | undefined,
        },
      );
      res.status(200).json(bookings);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  cancelBooking = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const booking = await this.examBookingService.cancelBooking(
        req.params.id,
        this.toRequester(req),
        req.body?.reason,
      );
      res.status(200).json(booking);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  rescheduleBooking = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const booking = await this.examBookingService.rescheduleBooking(
        req.params.id,
        new Date(req.body.scheduledAt),
        this.toRequester(req),
      );
      res.status(200).json(booking);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  updateStatus = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const booking = await this.examBookingService.updateStatus(
        req.params.id,
        req.body.status,
        this.toRequester(req),
      );
      res.status(200).json(booking);
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  linkResultExam = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      await this.examBookingService.linkResultExam(
        req.params.id,
        req.body.examId,
        this.toRequester(req),
      );
      res.status(204).send();
    } catch (error) {
      this.handleError(req, res, error);
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
