import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/apiResponse';

export function notFoundHandler(req: Request, res: Response) {
  return sendError(
    res,
    `Endpoint not found: ${req.method} ${req.originalUrl}`,
    404
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    const formatted = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(
      res,
      formatted[0]?.message || 'Validation failed.',
      400,
      formatted
    );
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.details);
  }

  // MongoDB Duplicate Key Error
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    return sendError(
      res,
      'A record with the provided unique identifier already exists.',
      409
    );
  }

  console.error('[Server Error]:', err);
  return sendError(
    res,
    'An unexpected server error occurred. Please try again later.',
    500
  );
}
