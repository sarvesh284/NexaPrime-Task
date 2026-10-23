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
      sendSuccess(res, { user: result.user, token: result.token }, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || 'Unknown';
      const result = await AuthService.login(req.body, ip, userAgent);
      setAuthCookie(res, result.token);
      sendSuccess(res, { user: result.user, token: result.token }, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getLoginHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.getLoginHistory(req.user!.userId);
      sendSuccess(res, result, 'Login history retrieved', 200);
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

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.resetPassword(req.body.token, req.body.password);
      // Clear cookie to ensure fresh login
      clearAuthCookie(res);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.verifyEmail(req.body.token);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.resendVerification(req.body.email);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async revokeSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.revokeSessions(req.user!.userId);
      clearAuthCookie(res);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}
