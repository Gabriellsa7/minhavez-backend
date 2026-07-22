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

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IAuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    res.status(401).json({ message: 'Token verification failed' });
    return;
  }
};

export const authorize =
  (...roles: EUserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.principalType !== EPrincipalType.USER) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
