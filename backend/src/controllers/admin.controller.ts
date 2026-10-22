import { NextFunction, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class AdminController {
  static async getKpis(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const kpis = await AdminService.getPlatformKpis();
      sendSuccess(res, { kpis }, 'Platform KPIs retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await AdminService.getPlatformAnalytics();
      sendSuccess(res, { analytics }, 'Platform analytics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getUsers(req.query as any);
      sendSuccess(res, { users: result.users }, 'Users retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.toggleUserStatus(
        req.params.id,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getStores(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getStores(req.query as any);
      sendSuccess(res, { stores: result.stores }, 'Stores retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async createStore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await AdminService.createStore(
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, { store }, 'Store created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await AdminService.updateStore(
        req.params.id,
        req.body,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, { store }, 'Store updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async assignOwner(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.assignStoreOwner(
        req.params.id,
        req.body.ownerId,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getReports(req.query as any);
      sendSuccess(res, { reports: result.reports }, 'Reports retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async moderateReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.moderateReport(
        req.params.id,
        req.body.action,
        req.body.notes,
        req.user!.userId,
        req.user!.email
      );
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getAuditLogs(req.query as any);
      sendSuccess(res, { auditLogs: result.auditLogs }, 'Audit logs retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}
