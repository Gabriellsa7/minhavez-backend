import { Request, Response } from 'express';
import {
  authorizeAdminOrSelfProfessional,
  authorizeSelfOrStaff,
  authorizeUnitStaff,
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

function buildReq(
  user?: Partial<IAuthPayload>,
  params: Record<string, string> = {},
): Request {
  return {
    originalUrl: '/resource',
    params,
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

const receptionist = {
  sub: 'receptionist-1',
  principalType: EPrincipalType.RECEPTIONIST,
  role: undefined,
  healthUnitId: 'unit-1',
};

describe('authorizeUnitStaff', () => {
  it('lets staff of the unit that owns the resource through', async () => {
    const next = jest.fn();
    const res = buildRes();

    await authorizeUnitStaff(async () => 'unit-1')(
      buildReq(receptionist),
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects staff of another unit with 403', async () => {
    const next = jest.fn();
    const res = buildRes();

    await authorizeUnitStaff(async () => 'unit-2')(
      buildReq(receptionist),
      res,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('lets admins through whatever the unit', async () => {
    const next = jest.fn();

    await authorizeUnitStaff(async () => 'unit-2')(
      buildReq({ role: EUserRole.ADMIN }),
      buildRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a patient with 403 unless the member check accepts them', async () => {
    const rejected = buildRes();
    await authorizeUnitStaff(async () => 'unit-1')(
      buildReq({}),
      rejected,
      jest.fn(),
    );
    expect(rejected.status).toHaveBeenCalledWith(403);

    const next = jest.fn();
    await authorizeUnitStaff(
      async () => 'unit-1',
      async () => true,
    )(buildReq({}), buildRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a request without a user with 401', async () => {
    const res = buildRes();

    await authorizeUnitStaff(async () => 'unit-1')(buildReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('authorizeSelfOrStaff', () => {
  it('lets users read their own account and staff read any', () => {
    const own = jest.fn();
    authorizeSelfOrStaff(buildReq({}, { id: 'user-1' }), buildRes(), own);
    expect(own).toHaveBeenCalledWith();

    const staff = jest.fn();
    authorizeSelfOrStaff(
      buildReq(receptionist, { id: 'user-2' }),
      buildRes(),
      staff,
    );
    expect(staff).toHaveBeenCalledWith();
  });

  it("rejects a patient reading someone else's account with 403", () => {
    const res = buildRes();

    authorizeSelfOrStaff(buildReq({}, { id: 'user-2' }), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('authorizeAdminOrSelfProfessional', () => {
  const professional = {
    sub: 'professional-1',
    principalType: EPrincipalType.HEALTH_PROFESSIONAL,
    role: undefined,
  };

  it('lets a professional edit their own profile and admins edit any', () => {
    const own = jest.fn();
    authorizeAdminOrSelfProfessional(
      buildReq(professional, { id: 'professional-1' }),
      buildRes(),
      own,
    );
    expect(own).toHaveBeenCalledWith();

    const admin = jest.fn();
    authorizeAdminOrSelfProfessional(
      buildReq({ role: EUserRole.ADMIN }, { id: 'professional-1' }),
      buildRes(),
      admin,
    );
    expect(admin).toHaveBeenCalledWith();
  });

  it("rejects another professional's or a receptionist's edit with 403", () => {
    const other = buildRes();
    authorizeAdminOrSelfProfessional(
      buildReq(professional, { id: 'professional-2' }),
      other,
      jest.fn(),
    );
    expect(other.status).toHaveBeenCalledWith(403);

    const reception = buildRes();
    authorizeAdminOrSelfProfessional(
      buildReq(receptionist, { id: 'professional-1' }),
      reception,
      jest.fn(),
    );
    expect(reception.status).toHaveBeenCalledWith(403);
  });
});
