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

  static async getFilterOptions(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StoreService.getFilterOptions();
      sendSuccess(res, result, 'Filter options retrieved', 200);
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

  static async toggleFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StoreService.toggleFavorite(req.user!.userId, req.params.id);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getUserFavorites(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StoreService.getUserFavorites(req.user!.userId);
      sendSuccess(res, result, 'User favorites retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getTrending(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stores = await StoreService.getTrendingStores();
      sendSuccess(res, { stores }, 'Trending stores retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async recordView(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.userId) {
        await StoreService.recordRecentlyViewed(req.user.userId, req.params.id);
      }
      sendSuccess(res, { recorded: true }, 'View recorded', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getRecentlyViewed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StoreService.getRecentlyViewed(req.user!.userId);
      sendSuccess(res, result, 'Recently viewed stores retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  static async clearRecentlyViewed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await StoreService.clearRecentlyViewed(req.user!.userId);
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}
