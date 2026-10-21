import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      setAuthCookie(res, result.token);
      sendSuccess(res, { user: result.user }, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      setAuthCookie(res, result.token);
      sendSuccess(res, { user: result.user }, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearAuthCookie(res);
      sendSuccess(res, null, 'Successfully logged out', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser(req.user!.userId);
      sendSuccess(res, { user }, 'Session verified', 200);
    } catch (error) {
      next(error);
    }
  }
}
