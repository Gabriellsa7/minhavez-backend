import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  EPrincipalType,
  IAuthPayload,
} from '../../../domain/auth/interfaces/auth.interface';
import { EUserRole } from '../../../domain/user/interfaces/user.interface';
declare module 'express' {
  interface Request {
    user?: IAuthPayload;
  }
}

const sendError = (
  req: Request,
  res: Response,
  status: number,
  message: string,
): void => {
  res.status(status).json({
    status,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    sendError(req, res, 401, 'Authorization header missing');
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IAuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(req, res, 401, 'Token expired');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      sendError(req, res, 401, 'Invalid token');
      return;
    }
    sendError(req, res, 401, 'Token verification failed');
    return;
  }
};

export const authorize =
  (...roles: EUserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendError(req, res, 401, 'Unauthorized');
      return;
    }

    if (req.user.principalType !== EPrincipalType.USER) {
      sendError(req, res, 403, 'Forbidden');
      return;
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      sendError(req, res, 403, 'Forbidden');
      return;
    }

    next();
  };
