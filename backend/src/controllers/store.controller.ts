import { NextFunction, Response } from 'express';
import { StoreService } from '../services/store.service';
import { RatingService } from '../services/rating.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class StoreController {
  static async getStores(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StoreService.getStores(req.query as any, req.user?.userId);
      sendSuccess(res, { stores: result.stores }, 'Stores retrieved successfully', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getStoreById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const store = await StoreService.getStoreById(req.params.id, req.user?.userId);
      sendSuccess(res, { store }, 'Store details retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMyRating(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RatingService.getUserRatingForStore(req.user!.userId, req.params.id);
      sendSuccess(res, result, 'Personal rating retrieved', 200);
    } catch (error) {
      next(error);
    }
  }
}
