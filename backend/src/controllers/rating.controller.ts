import { NextFunction, Response } from 'express';
import { RatingService } from '../services/rating.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class RatingController {
  static async updateRating(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.id;
      const { rating } = req.body;
      const userId = req.user!.userId;

      const result = await RatingService.submitOrUpdateRating(userId, storeId, rating);
      sendSuccess(res, result, 'Rating submitted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}
