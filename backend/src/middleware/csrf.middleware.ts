import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { sendError } from '../utils/response';

export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Safe HTTP methods do not change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip in test environment
  if (env.NODE_ENV === 'test') {
    return next();
  }

  // Check Origin or Referer header if present
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const frontendUrl = new URL(env.FRONTEND_URL);
      if (originUrl.origin !== frontendUrl.origin && !originUrl.origin.includes('localhost') && !originUrl.origin.includes('127.0.0.1')) {
        sendError(res, 'CSRF verification failed: Untrusted origin', 403, 'CSRF_ERROR');
        return;
      }
    } catch {
      sendError(res, 'CSRF verification failed: Malformed origin header', 403, 'CSRF_ERROR');
      return;
    }
  }

  next();
};
