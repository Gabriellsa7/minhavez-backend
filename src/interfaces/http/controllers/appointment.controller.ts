import { Request, Response, Router } from 'express';
import { IController } from './IController';
import { IAppointmentService } from '../../../domain/appointment/interfaces/appointment.service.interface';
import {
  IParamsCreateAppointment,
  IParamsUpdateAppointment,
} from '../../../domain/appointment/repository/appointment.repository.interface';

export class AppointmentController implements IController {
  router: Router;
  private readonly appointmentService: IAppointmentService;

  constructor(appointmentService: IAppointmentService) {
    this.appointmentService = appointmentService;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes() {
    this.router.get('/appointments', this.getAppointments);
    this.router.get('/appointments/:id', this.getAppointmentById);
    this.router.get(
      '/health-units/:id/appointments',
      this.getAppointmentsByHealthUnit,
    );
    this.router.get(
      '/patients/:id/appointments',
      this.getAppointmentsByPatient,
    );
    this.router.get(
      '/health-professionals/:id/appointments',
      this.getAppointmentsByProfessional,
    );
    this.router.post('/appointments', this.createAppointment);
    this.router.put('/appointments/:id', this.updateAppointment);
    this.router.delete('/appointments/:id', this.deleteAppointment);
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
        res.status(404).json({ message: 'Appointment not found' });
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
      const appointments =
        await this.appointmentService.listAppointmentsByPatientId(id);
      res.status(200).json(appointments);
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

  createAppointment = async (req: Request, res: Response): Promise<void> => {
    const data: IParamsCreateAppointment = req.body;
    try {
      const newAppointment =
        await this.appointmentService.createAppointment(data);
      res.status(201).json(newAppointment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  updateAppointment = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData: IParamsUpdateAppointment = {
      appointmentData: req.body,
    };
    try {
      const updatedAppointment =
        await this.appointmentService.updateAppointmentById(id, updateData);
      if (!updatedAppointment) {
        res.status(404).json({ message: 'Appointment not found' });
        return;
      }
      res.status(200).json(updatedAppointment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
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
        res.status(404).json({ message: 'Appointment not found' });
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
