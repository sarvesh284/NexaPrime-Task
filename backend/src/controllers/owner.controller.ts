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

  static async getRatings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OwnerService.getOwnerRatings(req.user!.userId, req.query as any);
      sendSuccess(res, { ratings: result.ratings }, 'Owner ratings retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}
