import { NextFunction, Response } from 'express';
import { RatingService } from '../services/rating.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class RatingController {
  static async updateRating(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.id;
      const { rating, comment } = req.body;
      const userId = req.user!.userId;

      const result = await RatingService.submitOrUpdateRating(userId, storeId, rating, comment);
      sendSuccess(res, result, 'Rating and review submitted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getStoreReviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeId = req.params.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const sort = (req.query.sort as string) || 'newest';

      const result = await RatingService.getStoreReviews(
        storeId,
        page,
        limit,
        sort,
        req.user?.userId
      );

      sendSuccess(
        res,
        { reviews: result.reviews, distribution: result.distribution },
        'Reviews retrieved successfully',
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  static async toggleHelpful(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const userId = req.user!.userId;

      const result = await RatingService.toggleHelpfulVote(reviewId, userId);
      sendSuccess(res, result, 'Helpful vote updated', 200);
    } catch (error) {
      next(error);
    }
  }

  static async reportReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reviewId = req.params.reviewId;
      const reporterId = req.user!.userId;
      const { reason, details } = req.body;

      const result = await RatingService.reportReview(reviewId, reporterId, reason, details);
      sendSuccess(res, result, result.message, 201);
    } catch (error) {
      next(error);
    }
  }
}
