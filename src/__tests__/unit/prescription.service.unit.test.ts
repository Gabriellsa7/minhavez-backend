import { PrescriptionService } from '../../domain/prescription/service/prescription.service';
import { IExamOffering } from '../../domain/exam-offering/interfaces/exam-offering.interface';
import { IPrescription } from '../../domain/prescription/interfaces/prescription.interface';

const OFFERING: IExamOffering = {
  _id: 'offering-1',
  healthUnitId: 'unit-1',
  name: 'Hemograma',
  durationMinutes: 20,
  requiresPreparation: false,
  requiresFasting: false,
  acceptedInsurances: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function buildService(overrides?: {
  offering?: IExamOffering | null;
  prescriptions?: IPrescription[];
}) {
  const created: IPrescription[] = [];

  const prescriptionRepository = {
    create: jest.fn(async (data: Partial<IPrescription>): Promise<IPrescription> => {
      const prescription: IPrescription = {
        _id: 'prescription-1',
        patientId: 'patient-1',
        professionalId: 'prof-1',
        healthUnitId: 'unit-1',
        exams: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      created.push(prescription);
      return prescription;
    }),
    findById: jest.fn(async () => null),
    findByPatientId: jest.fn(async () => overrides?.prescriptions ?? []),
    findByProfessionalId: jest.fn(async () => overrides?.prescriptions ?? []),
    existsForQueueItemId: jest.fn(async () => false),
  };

  const examOfferingRepository = {
    createExamOffering: jest.fn(),
    updateExamOfferingById: jest.fn(),
    getExamOfferingById: jest.fn(async () =>
      overrides?.offering === undefined ? OFFERING : overrides.offering,
    ),
    listExamOfferingsByHealthUnitId: jest.fn(async () => []),
  };

  const patientRepository = {
    createPatient: jest.fn(),
    updatePatientById: jest.fn(),
    deletePatientById: jest.fn(),
    getPatientById: jest.fn(async () => ({
      _id: 'patient-1',
      userId: 'user-1',
      cpf: '11122233344',
      birthDate: '1990-01-01',
      priority: 'NORMAL',
      phone: '11999999999',
      medicalDocuments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    getPatientByUserId: jest.fn(),
    getPatientByCpf: jest.fn(),
    listPatients: jest.fn(),
    addMedicalDocument: jest.fn(),
    removeMedicalDocument: jest.fn(),
  };

  const userRepository = {
    createUser: jest.fn(),
    updateUserById: jest.fn(),
    deleteUserById: jest.fn(),
    findById: jest.fn(async () => ({ _id: 'user-1', name: 'Jane Doe' })),
    findUserByEmail: jest.fn(),
    findUserByEmailWithPassword: jest.fn(),
    findUserById: jest.fn(),
    listUsers: jest.fn(),
    disableDeviceToken: jest.fn(),
    updatePassword: jest.fn(),
  };

  const service = new PrescriptionService({
    prescriptionRepository: prescriptionRepository as never,
    examOfferingRepository: examOfferingRepository as never,
    patientRepository: patientRepository as never,
    userRepository: userRepository as never,
  });

  return { service, prescriptionRepository, created };
}

describe('PrescriptionService.createPrescription', () => {
  const requester = { sub: 'prof-1', isAdmin: false, healthUnitId: 'unit-1' };

  it('creates a prescription with a single exam and no schedule (the patient books it later)', async () => {
    const { service } = buildService();

    const prescription = await service.createPrescription(
      {
        patientId: 'patient-1',
        exams: [{ examOfferingId: 'offering-1' }],
      },
      requester,
    );

    expect(prescription.exams).toHaveLength(1);
    expect(prescription.exams[0].examOfferingName).toBe('Hemograma');
    expect(prescription.exams[0]).not.toHaveProperty('scheduledAt');
    expect(prescription.professionalId).toBe('prof-1');
    expect(prescription.healthUnitId).toBe('unit-1');
    expect(prescription.patientName).toBe('Jane Doe');
  });

  it('creates a prescription with multiple exams', async () => {
    const { service } = buildService();

    const prescription = await service.createPrescription(
      {
        patientId: 'patient-1',
        exams: [
          { examOfferingId: 'offering-1' },
          { examOfferingId: 'offering-1' },
        ],
      },
      requester,
    );

    expect(prescription.exams).toHaveLength(2);
  });

  it('rejects an empty exams array', async () => {
    const { service } = buildService();

    await expect(
      service.createPrescription(
        { patientId: 'patient-1', exams: [] },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects an exam offering that does not belong to the requester health unit', async () => {
    const { service } = buildService({
      offering: { ...OFFERING, healthUnitId: 'other-unit' },
    });

    await expect(
      service.createPrescription(
        {
          patientId: 'patient-1',
          exams: [{ examOfferingId: 'offering-1' }],
        },
        requester,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a non-admin general professional missing a healthUnitId (malformed token)', async () => {
    const { service } = buildService();

    await expect(
      service.createPrescription(
        {
          patientId: 'patient-1',
          exams: [{ examOfferingId: 'offering-1' }],
        },
        { sub: 'prof-1', isAdmin: false, healthUnitId: undefined },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('PrescriptionService.listPrescriptionsByProfessionalId', () => {
  const existingPrescription: IPrescription = {
    _id: 'prescription-1',
    patientId: 'patient-1',
    professionalId: 'prof-1',
    healthUnitId: 'unit-1',
    exams: [
      {
        examOfferingId: 'offering-1',
        examOfferingName: 'Hemograma',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('lets a professional list their own prescriptions, enriched with patientName', async () => {
    const { service } = buildService({ prescriptions: [existingPrescription] });

    const prescriptions = await service.listPrescriptionsByProfessionalId(
      'prof-1',
      { sub: 'prof-1', isAdmin: false, healthUnitId: 'unit-1' },
    );

    expect(prescriptions).toHaveLength(1);
    expect(prescriptions[0].patientName).toBe('Jane Doe');
  });

  it('lets an admin list any professional\'s prescriptions', async () => {
    const { service } = buildService({ prescriptions: [existingPrescription] });

    const prescriptions = await service.listPrescriptionsByProfessionalId(
      'prof-1',
      { sub: 'admin-1', isAdmin: true },
    );

    expect(prescriptions).toHaveLength(1);
  });

  it('rejects a professional trying to list another professional\'s prescriptions', async () => {
    const { service } = buildService({ prescriptions: [existingPrescription] });

    await expect(
      service.listPrescriptionsByProfessionalId('prof-1', {
        sub: 'prof-2',
        isAdmin: false,
        healthUnitId: 'unit-1',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
