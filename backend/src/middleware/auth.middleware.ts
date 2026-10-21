import { NextFunction, Response } from 'express';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { UserModel } from '../models/user.model';
import { sendError } from '../utils/response';

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.[env.COOKIE_NAME];

    // Fallback to Bearer token if provided in header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      sendError(res, 'Authentication required. Please log in.', 401, 'UNAUTHORIZED');
      return;
    }

    const payload = verifyToken(token);

    // Verify user exists and is active
    const user = await UserModel.findById(payload.userId).select('isActive role email');
    if (!user || !user.isActive) {
      sendError(res, 'Account is inactive or no longer exists', 401, 'ACCOUNT_INACTIVE');
      return;
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    sendError(res, 'Invalid or expired session. Please log in again.', 401, 'INVALID_TOKEN');
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.[env.COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const payload = verifyToken(token);
      const user = await UserModel.findById(payload.userId).select('isActive role email');
      if (user && user.isActive) {
        req.user = {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        };
      }
    }
  } catch (ignored) {
    // Optional auth silently proceeds if token is invalid
  }
  next();
};
