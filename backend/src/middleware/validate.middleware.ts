import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', fieldErrors);
      return;
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      sendError(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR', fieldErrors);
      return;
    }
    req.query = result.data;
    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      sendError(res, 'Invalid route parameter', 400, 'VALIDATION_ERROR', fieldErrors);
      return;
    }
    req.params = result.data;
    next();
  };
};

const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'general';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
};
