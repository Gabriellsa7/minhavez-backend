import { Request, Response } from 'express';
import { authorizeQueueOwner } from '../../interfaces/http/middlewary/auth.middleware';
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
    originalUrl: '/queues/queue-1/open',
    user: user
      ? {
          sub: 'professional-1',
          email: 'x@example.com',
          name: 'X',
          principalType: EPrincipalType.HEALTH_PROFESSIONAL,
          ...user,
        }
      : undefined,
  } as unknown as Request;
}

describe('authorizeQueueOwner', () => {
  it('lets the professional who owns the queue through', async () => {
    const next = jest.fn();
    const res = buildRes();

    await authorizeQueueOwner(async () => 'professional-1')(
      buildReq({}),
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a professional operating someone else's queue with 403", async () => {
    const next = jest.fn();
    const res = buildRes();

    await authorizeQueueOwner(async () => 'professional-2')(
      buildReq({}),
      res,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('lets admins through without resolving the owner', async () => {
    const next = jest.fn();
    const resolve = jest.fn();

    await authorizeQueueOwner(resolve)(
      buildReq({ principalType: EPrincipalType.USER, role: EUserRole.ADMIN }),
      buildRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(resolve).not.toHaveBeenCalled();
  });

  it('falls through when the queue does not exist so the handler answers 404', async () => {
    const next = jest.fn();

    await authorizeQueueOwner(async () => null)(buildReq({}), buildRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('responds 401 without an authenticated user', async () => {
    const res = buildRes();

    await authorizeQueueOwner(async () => 'professional-1')(
      buildReq(),
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
