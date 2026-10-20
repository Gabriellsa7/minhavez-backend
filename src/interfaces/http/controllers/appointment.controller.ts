import { Request, Response, Router } from 'express';
import { IController } from './IController';
import {
  IAppointmentRequester,
  IAppointmentService,
} from '../../../domain/appointment/interfaces/appointment.service.interface';
import {
  IParamsCreateAppointment,
  IParamsUpdateAppointment,
} from '../../../domain/appointment/repository/appointment.repository.interface';
import {
  authMiddleware,
  authorize,
  authorizePatientOwner,
  authorizeStaff,
} from '../middlewary/auth.middleware';
import { IPatientService } from '../../../domain/patient/interfaces/patient.service.interface';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';
import { EPrincipalType } from '../../../domain/auth/interfaces/auth.interface';
import { AppError } from '../../../shared/errors/AppError';
import {
  buildPaginatedResponse,
  parsePagination,
} from '../../../shared/utils/pagination';
import { EAppointmentStatus } from '../../../domain/appointment/interfaces/appointment.interface';

export class AppointmentController implements IController {
  router: Router;
  private readonly appointmentService: IAppointmentService;
  private readonly patientService: Pick<IPatientService, 'getPatientById'>;

  constructor(
    appointmentService: IAppointmentService,
    patientService: Pick<IPatientService, 'getPatientById'>,
  ) {
    this.appointmentService = appointmentService;
    this.patientService = patientService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get(
      '/appointments',
      authMiddleware,
      authorizeStaff,
      this.getAppointments,
    );
    this.router.get(
      '/appointments/:id',
      authMiddleware,
      authorizePatientOwner(async (req) => {
        const appointment = await this.appointmentService
          .getAppointmentById(req.params.id)
          .catch(() => null);
        if (!appointment) return null;
        return (await this.patientService.getPatientById(appointment.patientId))
          ?.userId;
      }),
      this.getAppointmentById,
    );
    this.router.get(
      '/health-units/:id/appointments',
      this.getAppointmentsByHealthUnit,
    );
    this.router.get(
      '/patients/:id/appointments',
      authMiddleware,
      authorizePatientOwner(
        async (req) =>
          (await this.patientService.getPatientById(req.params.id))?.userId,
      ),
      this.getAppointmentsByPatient,
    );
    this.router.delete(
      '/patients/:id/appointments',
      authMiddleware,
      authorizePatientOwner(
        async (req) =>
          (await this.patientService.getPatientById(req.params.id))?.userId,
      ),
      this.clearAppointmentHistory,
    );
    this.router.get(
      '/health-professionals/:id/appointments',
      this.getAppointmentsByProfessional,
    );
    this.router.post('/appointments', authMiddleware, this.createAppointment);
    this.router.put(
      '/appointments/:id',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.updateAppointment,
    );
    this.router.patch(
      '/appointments/:id/cancel',
      authMiddleware,
      this.cancelAppointment,
    );
    this.router.delete(
      '/appointments/:id',
      authMiddleware,
      authorize(EUserRole.ADMIN),
      this.deleteAppointment,
    );
  }

  private toRequester(req: Request): IAppointmentRequester {
    const user = req.user!;
    return {
      sub: user.sub,
      isAdmin:
        user.principalType === EPrincipalType.USER &&
        user.role === EUserRole.ADMIN,
    };
  }

  private handleError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ error: (error as Error).message });
  }

  getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const appointments = await this.appointmentService.listAppointments({});
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getAppointmentById = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const appointment = await this.appointmentService.getAppointmentById(id);
      if (!appointment) {
        res.status(404).json({ message: 'Consulta não encontrada.' });
        return;
      }
      res.status(200).json(appointment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getAppointmentsByHealthUnit = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const appointments =
        await this.appointmentService.listAppointmentsByHealthUnitId(id);
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getAppointmentsByPatient = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const status = Array.isArray(req.query.status)
        ? (req.query.status as EAppointmentStatus[])
        : typeof req.query.status === 'string'
          ? (req.query.status
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean) as EAppointmentStatus[])
          : undefined;
      const pagination = parsePagination({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
      });
      const { items, totalItems } =
        await this.appointmentService.listAppointmentsByPatientId(
          id,
          status,
          pagination,
        );
      res
        .status(200)
        .json(buildPaginatedResponse(items, totalItems, pagination));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getAppointmentsByProfessional = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const appointments =
        await this.appointmentService.listAppointmentsByProfessionalId(id);
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  clearAppointmentHistory = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deleted =
        await this.appointmentService.clearAppointmentHistoryByPatientId(id);
      res.status(200).json({
        message: 'Histórico limpo com sucesso',
        count: deleted.length,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  createAppointment = async (req: Request, res: Response): Promise<void> => {
    const data: IParamsCreateAppointment = req.body;
    try {
      console.log('='.repeat(80));
      console.log('[AppointmentController] POST /appointments');
      console.log('Request body:', JSON.stringify(data, null, 2));
      console.log('='.repeat(80));

      const requiredFields = [
        'patientId',
        'professionalId',
        'healthUnitId',
        'dateTime',
      ];
      const missingFields = requiredFields.filter(
        (field) => !data[field as keyof IParamsCreateAppointment],
      );

      if (missingFields.length > 0) {
        console.error(
          '[AppointmentController] Missing required fields:',
          missingFields,
        );
        res.status(400).json({
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }

      const newAppointment =
        await this.appointmentService.createAppointment(data);
      console.log(
        '[AppointmentController] Appointment created successfully:',
        newAppointment._id,
      );
      res.status(201).json(newAppointment);
    } catch (error) {
      console.error(
        '[AppointmentController] Error creating appointment:',
        error,
      );
      const status = error instanceof AppError ? error.status : 400;
      res.status(status).json({
        message: (error as Error).message,
        status,
        timestamp: new Date().toISOString(),
        path: req.path,
        errors: [
          {
            field: 'appointment',
            message: (error as Error).message,
            value: JSON.stringify(req.body),
          },
        ],
      });
    }
  };

  updateAppointment = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData: IParamsUpdateAppointment = req.body;
    try {
      const updatedAppointment =
        await this.appointmentService.updateAppointmentById(id, updateData);
      if (!updatedAppointment) {
        res.status(404).json({ message: 'Consulta não encontrada.' });
        return;
      }
      res.status(200).json(updatedAppointment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  cancelAppointment = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    try {
      const appointment = await this.appointmentService.cancelAppointment(
        req.params.id,
        this.toRequester(req),
      );
      res.status(200).json(appointment);
    } catch (error) {
      this.handleError(res, error);
    }
  };

  deleteAppointment = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    try {
      const deletedAppointment =
        await this.appointmentService.deleteAppointmentById(id);
      if (!deletedAppointment) {
        res.status(404).json({ message: 'Consulta não encontrada.' });
        return;
      }
      res.status(200).json(deletedAppointment);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };

  public getRoutes(): Router {
    return this.router;
  }
}
