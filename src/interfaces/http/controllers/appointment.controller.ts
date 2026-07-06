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
      console.log('='.repeat(80));
      console.log('[AppointmentController] POST /appointments');
      console.log('Request body:', JSON.stringify(data, null, 2));
      console.log('='.repeat(80));

      // Validate required fields
      const requiredFields = ['patientId', 'professionalId', 'healthUnitId', 'dateTime'];
      const missingFields = requiredFields.filter(field => !data[field as keyof IParamsCreateAppointment]);
      
      if (missingFields.length > 0) {
        console.error('[AppointmentController] Missing required fields:', missingFields);
        res.status(400).json({
          error: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return;
      }

      const newAppointment =
        await this.appointmentService.createAppointment(data);
      console.log('[AppointmentController] Appointment created successfully:', newAppointment._id);
      res.status(201).json(newAppointment);
    } catch (error) {
      console.error('[AppointmentController] Error creating appointment:', error);
      res.status(400).json({
        message: (error as Error).message,
        status: 400,
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
