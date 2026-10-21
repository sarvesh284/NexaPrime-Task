import { NextFunction, Response } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { sendError } from '../utils/response';

export const requireRole = (role: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (req.user.role !== role) {
      sendError(
        res,
        'Access denied: You do not have permission to access this resource',
        403,
        'FORBIDDEN'
      );
      return;
    }

    next();
  };
};
