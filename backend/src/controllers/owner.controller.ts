import { NextFunction, Response } from 'express';
import { OwnerService } from '../services/owner.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class OwnerController {
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await OwnerService.getDashboard(req.user!.userId);
      sendSuccess(res, { dashboard }, 'Owner dashboard retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await OwnerService.getAnalytics(req.user!.userId, req.query as any);
      sendSuccess(res, { analytics }, 'Owner analytics retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getRatings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OwnerService.getOwnerRatings(req.user!.userId, req.query as any);
      sendSuccess(res, { ratings: result.ratings }, 'Owner ratings retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await OwnerService.exportRatingsCsv(req.user!.userId, req.query as any);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=owner-ratings-${Date.now()}.csv`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
