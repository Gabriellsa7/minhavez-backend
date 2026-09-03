import { NextFunction, Request, Response } from 'express';
import { HttpError } from 'express-openapi-validator/dist/framework/types';
import { Logger } from 'traceability';
import { AppError } from './AppError';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    const logPayload = JSON.stringify({
      eventName: 'app.error',
      status: error.status,
      message: error.message,
      path: req.originalUrl,
    });

    if (error.status >= 500) {
      Logger.error(logPayload, { statusCode: error.status });
    } else {
      Logger.warn(logPayload, { statusCode: error.status });
    }

    return res.status(error.status).json({
      status: error.status,
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  if (error instanceof HttpError) {
    if (error.status === 500) {
      Logger.error(JSON.stringify(error), { statusCode: error.status });
    }

    return res.status(error.status).json({
      status: error.status,
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }

  Logger.error(
    JSON.stringify({
      eventName: 'server.error',
      message: error.message,
      stack: error.stack,
    }),
    { statusCode: 500 },
  );

  return res.status(500).json({
    status: 500,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}
