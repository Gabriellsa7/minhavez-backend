import { Request, Response, Router } from 'express';
import { PatientService } from '../../../domain/patient/service/patient.service';
import { IController } from './IController';

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
    this.router.post('/patients', this.createPatient);
    this.router.put('/patients/:id', this.updatePatient);
    this.router.delete('/patients/:id', this.deletePatient);
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
        res.status(404).json({ message: 'Patient not found' });
        return;
      }
      res.status(200).json(patient);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
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
      res.status(400).json({ error: (error as Error).message });
    }
  };

  updatePatient = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    try {
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
