import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IAuthPayload } from '../../../domain/auth/interfaces/auth.interface';

// Extend Express Request to include user
declare module 'express' {
  interface Request {
    user?: IAuthPayload;
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
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