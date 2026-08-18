import { PatientService } from '../../domain/patient/service/patient.service';
import { EPatientPriority } from '../../domain/patient/interfaces/patient.interface';
import { IPatientRepository } from '../../domain/patient/repository/patient.repository.interface';

function buildService(overrides: Partial<IPatientRepository> = {}) {
  const patientRepository: IPatientRepository = {
    createPatient: jest.fn().mockImplementation((params) =>
      Promise.resolve({ _id: 'patient-1', medicalDocuments: [], ...params }),
    ),
    updatePatientById: jest.fn(),
    deletePatientById: jest.fn(),
    getPatientById: jest.fn(),
    getPatientByUserId: jest.fn().mockResolvedValue(null),
    getPatientByCpf: jest.fn(),
    listPatients: jest.fn(),
    addMedicalDocument: jest.fn(),
    removeMedicalDocument: jest.fn(),
    ...overrides,
  };

  return { service: new PatientService({ patientRepository }), patientRepository };
}

describe('PatientService.createPatient', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('forces ELDERLY priority when the patient is older than 60, overriding the selected reason', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T12:00:00.000Z'));
    const { service, patientRepository } = buildService();

    const patient = await service.createPatient({
      userId: 'user-1',
      cpf: '111.111.111-11',
      birthDate: '1960-01-01',
      phone: '11999999999',
      priority: EPatientPriority.CHRONIC_CONDITION,
    });

    expect(patient.priority).toBe(EPatientPriority.ELDERLY);
    expect(patientRepository.createPatient).toHaveBeenCalledWith(
      expect.objectContaining({ priority: EPatientPriority.ELDERLY }),
    );
  });

  it('keeps the selected priority reason when the patient is 60 or younger', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-18T12:00:00.000Z'));
    const { service } = buildService();

    const patient = await service.createPatient({
      userId: 'user-1',
      cpf: '111.111.111-11',
      birthDate: '2000-01-01',
      phone: '11999999999',
      priority: EPatientPriority.CHRONIC_CONDITION,
    });

    expect(patient.priority).toBe(EPatientPriority.CHRONIC_CONDITION);
  });

  it('rejects creating a second patient for the same user', async () => {
    const { service } = buildService({
      getPatientByUserId: jest.fn().mockResolvedValue({ _id: 'existing' }),
    });

    await expect(
      service.createPatient({
        userId: 'user-1',
        cpf: '111.111.111-11',
        birthDate: '2000-01-01',
        phone: '11999999999',
        priority: EPatientPriority.NORMAL,
      }),
    ).rejects.toThrow('A patient with this user ID already exists');
  });
});
