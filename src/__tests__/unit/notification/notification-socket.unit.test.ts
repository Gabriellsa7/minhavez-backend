import {
  ISocketAudienceDeps,
  isSocketRecipient,
  resolveSocketAudience,
} from '../../../infrastructure/socket/notification.socket';
import {
  EPrincipalType,
  IAuthPayload,
} from '../../../domain/auth/interfaces/auth.interface';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';

function buildDeps(): ISocketAudienceDeps {
  return {
    queueRepository: {
      getQueueById: jest.fn(async (id: string) =>
        id === 'queue-1' ? { healthUnitId: 'unit-1' } : null,
      ),
    } as unknown as ISocketAudienceDeps['queueRepository'],
    patientRepository: {
      getPatientById: jest.fn(async (id: string) =>
        ({ 'patient-1': { userId: 'user-1' }, 'patient-2': { userId: 'user-2' } })[
          id
        ] ?? null,
      ),
    } as unknown as ISocketAudienceDeps['patientRepository'],
    healthUnitRepository: {
      getHealthUnitById: jest.fn(async (id: string) =>
        id === 'unit-1' ? { userId: 'admin-1' } : null,
      ),
    } as unknown as ISocketAudienceDeps['healthUnitRepository'],
  };
}

function principal(overrides: Partial<IAuthPayload>): IAuthPayload {
  return {
    sub: 'someone',
    email: 'x@example.com',
    name: 'X',
    principalType: EPrincipalType.USER,
    role: EUserRole.USER,
    ...overrides,
  };
}

describe('resolveSocketAudience', () => {
  it('resolves the health unit from the queue and the owners of patients and unit', async () => {
    const audience = await resolveSocketAudience(
      { queueId: 'queue-1', patientIds: ['patient-1'] },
      buildDeps(),
    );

    expect(audience.healthUnitId).toBe('unit-1');
    expect([...audience.userIds].sort()).toEqual(['admin-1', 'user-1']);
  });

  it('reaches nobody for an empty scope', async () => {
    const audience = await resolveSocketAudience({}, buildDeps());

    expect(audience.healthUnitId).toBeUndefined();
    expect(audience.userIds.size).toBe(0);
  });
});

describe('isSocketRecipient', () => {
  const audience = {
    healthUnitId: 'unit-1',
    userIds: new Set(['user-1', 'admin-1']),
  };

  it('delivers to staff of the same unit only', () => {
    expect(
      isSocketRecipient(
        principal({
          principalType: EPrincipalType.HEALTH_PROFESSIONAL,
          healthUnitId: 'unit-1',
        }),
        audience,
      ),
    ).toBe(true);
    expect(
      isSocketRecipient(
        principal({
          principalType: EPrincipalType.RECEPTIONIST,
          healthUnitId: 'unit-2',
        }),
        audience,
      ),
    ).toBe(false);
  });

  it('delivers to the patient owner and the unit admin, not to other users', () => {
    expect(isSocketRecipient(principal({ sub: 'user-1' }), audience)).toBe(
      true,
    );
    expect(
      isSocketRecipient(
        principal({ sub: 'admin-1', role: EUserRole.ADMIN }),
        audience,
      ),
    ).toBe(true);
    expect(isSocketRecipient(principal({ sub: 'user-2' }), audience)).toBe(
      false,
    );
    expect(
      isSocketRecipient(
        principal({ sub: 'other-admin', role: EUserRole.ADMIN }),
        audience,
      ),
    ).toBe(false);
  });

  it('does not deliver unit events to staff when the unit is unknown', () => {
    expect(
      isSocketRecipient(
        principal({
          principalType: EPrincipalType.RECEPTIONIST,
          healthUnitId: undefined,
        }),
        { userIds: new Set() },
      ),
    ).toBe(false);
  });
});
