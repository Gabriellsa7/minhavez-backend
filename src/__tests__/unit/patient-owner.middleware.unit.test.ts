import { Request, Response } from 'express';
import {
  authorizePatientOwner,
  authorizeStaff,
} from '../../interfaces/http/middlewary/auth.middleware';
import {
  EPrincipalType,
  IAuthPayload,
} from '../../domain/auth/interfaces/auth.interface';
import { EUserRole } from '../../domain/user/interfaces/user.interface';

function buildRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as unknown as Response & typeof res;
}

function buildReq(user?: Partial<IAuthPayload>): Request {
  return {
    originalUrl: '/patients/patient-1',
    user: user
      ? {
          sub: 'user-1',
          email: 'x@example.com',
          name: 'X',
          principalType: EPrincipalType.USER,
          role: EUserRole.USER,
          ...user,
        }
      : undefined,
  } as unknown as Request;
}

describe('authorizePatientOwner', () => {
  it('lets a patient reach their own record', async () => {
    const next = jest.fn();
    const res = buildRes();

    await authorizePatientOwner(async () => 'user-1')(buildReq({}), res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a patient reaching someone else's record with 403", async () => {
    const next = jest.fn();
    const res = buildRes();

    await authorizePatientOwner(async () => 'user-2')(buildReq({}), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it.each([
    ['admins', { principalType: EPrincipalType.USER, role: EUserRole.ADMIN }],
    [
      'health professionals',
      { principalType: EPrincipalType.HEALTH_PROFESSIONAL, role: undefined },
    ],
    [
      'receptionists',
      { principalType: EPrincipalType.RECEPTIONIST, role: undefined },
    ],
  ])('lets %s through without resolving the owner', async (_, user) => {
    const next = jest.fn();
    const resolve = jest.fn();

    await authorizePatientOwner(resolve)(buildReq(user), buildRes(), next);

    expect(next).toHaveBeenCalledWith();
    expect(resolve).not.toHaveBeenCalled();
  });

  it('falls through when the patient does not exist so the handler answers 404', async () => {
    const next = jest.fn();

    await authorizePatientOwner(async () => null)(
      buildReq({}),
      buildRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('responds 401 without an authenticated user', async () => {
    const res = buildRes();

    await authorizePatientOwner(async () => 'user-1')(
      buildReq(),
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('authorizeStaff', () => {
  it('rejects patients with 403', () => {
    const next = jest.fn();
    const res = buildRes();

    authorizeStaff(buildReq({}), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('lets receptionists through', () => {
    const next = jest.fn();

    authorizeStaff(
      buildReq({ principalType: EPrincipalType.RECEPTIONIST, role: undefined }),
      buildRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });
});
