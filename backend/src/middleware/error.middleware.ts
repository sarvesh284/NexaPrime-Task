import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    sendError(
      res,
      `A record with this ${field} already exists.`,
      409,
      'DUPLICATE_KEY',
      { field, value: err.keyValue?.[field] }
    );
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, `Invalid format for parameter: ${err.path}`, 400, 'INVALID_ID');
    return;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details: Record<string, string[]> = {};
    for (const key in err.errors) {
      details[key] = [err.errors[key].message];
    }
    sendError(res, 'Database validation failed', 400, 'VALIDATION_ERROR', details);
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
    return;
  }
  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Session expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    return;
  }

  // SyntaxError (JSON parse failure)
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 'Invalid JSON payload received', 400, 'INVALID_JSON');
    return;
  }

  // Log unexpected errors in non-test mode
  if (env.NODE_ENV !== 'test') {
    console.error('Unhandled Application Error:', err);
  }

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal Server Error';

  sendError(res, message, err.statusCode || 500, 'INTERNAL_SERVER_ERROR');
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Resource not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
};
