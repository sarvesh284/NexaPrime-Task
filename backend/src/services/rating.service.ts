import mongoose from 'mongoose';
import { RatingModel } from '../models/rating.model';
import { StoreModel } from '../models/store.model';
import { ReportModel, ReportReason } from '../models/report.model';
import { sanitizeText } from '../utils/sanitize';
import { notificationService } from './notification.service';

export class RatingService {
  /**
   * Submit or update a rating with optional written comment
   */
  static async submitOrUpdateRating(
    userId: string,
    storeId: string,
    value: number,
    rawComment?: string | null
  ) {
    if (!mongoose.isValidObjectId(storeId)) {
      const error: any = new Error('Invalid store ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const store = await StoreModel.findOne({ _id: storeId, isActive: true });
    if (!store) {
      const error: any = new Error('Cannot rate store: Store does not exist or is inactive');
      error.statusCode = 404;
      error.code = 'STORE_NOT_FOUND';
      throw error;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const comment = sanitizeText(rawComment || '') || '';

    // Concurrency-safe atomic upsert
    let ratingDoc;
    const updateData: any = {
      value,
      comment,
      status: 'VISIBLE', // User edit restores/sets to visible
    };

    try {
      ratingDoc = await RatingModel.findOneAndUpdate(
        { userId: userObjectId, storeId: storeObjectId },
        { $set: updateData },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (err: any) {
      if (err.code === 11000) {
        ratingDoc = await RatingModel.findOneAndUpdate(
          { userId: userObjectId, storeId: storeObjectId },
          { $set: updateData },
          { new: true, runValidators: true }
        );
      } else {
        throw err;
      }
    }

    // Recalculate rating aggregates (only VISIBLE reviews)
    const [stats] = await RatingModel.aggregate([
      { $match: { storeId: storeObjectId, status: 'VISIBLE' } },
      {
        $group: {
          _id: '$storeId',
          averageRating: { $avg: '$value' },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats ? Math.round(stats.averageRating * 10) / 10 : 0;
    const ratingCount = stats?.ratingCount || 0;

    // Synchronize StoreModel for high-performance discovery queries
    await StoreModel.updateOne(
      { _id: storeObjectId },
      { $set: { averageRating, ratingCount } }
    );

    // Notify store owner about the new or updated rating (N1 / O4)
    if (store.ownerId) {
      await notificationService.createNotification(
        store.ownerId,
        'NEW_RATING',
        'Customer Rating Received',
        `A customer submitted a ${value}-star rating for ${store.name}.`,
        `/owner/dashboard`
      );
    }

    return {
      rating: {
        id: ratingDoc?._id.toString(),
        userId: userId,
        storeId: storeId,
        value: ratingDoc?.value,
        comment: ratingDoc?.comment,
        status: ratingDoc?.status,
        helpfulCount: ratingDoc?.helpfulCount || 0,
        updatedAt: ratingDoc?.updatedAt,
      },
      storeStats: {
        storeId,
        averageRating,
        ratingCount,
      },
    };
  }

  /**
   * Get the current user's rating for a specific store
   */
  static async getUserRatingForStore(userId: string, storeId: string) {
    if (!mongoose.isValidObjectId(storeId)) {
      const error: any = new Error('Invalid store ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const rating = await RatingModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      storeId: new mongoose.Types.ObjectId(storeId),
    });

    return {
      storeId,
      myRating: rating ? rating.value : null,
      comment: rating ? rating.comment : null,
      status: rating ? rating.status : null,
      updatedAt: rating ? rating.updatedAt : null,
    };
  }

  /**
   * Get paginated public reviews for a store with distribution breakdown
   */
  static async getStoreReviews(
    storeId: string,
    page: number = 1,
    limit: number = 10,
    sort: string = 'newest',
    currentUserId?: string
  ) {
    if (!mongoose.isValidObjectId(storeId)) {
      const error: any = new Error('Invalid store ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const store = await StoreModel.findOne({ _id: storeObjectId, isActive: true });
    if (!store) {
      const error: any = new Error('Store not found or inactive');
      error.statusCode = 404;
      error.code = 'STORE_NOT_FOUND';
      throw error;
    }

    // Determine sort condition
    let sortOptions: Record<string, any> = { createdAt: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    else if (sort === 'highest') sortOptions = { value: -1, createdAt: -1 };
    else if (sort === 'lowest') sortOptions = { value: 1, createdAt: -1 };
    else if (sort === 'helpful') sortOptions = { helpfulCount: -1, createdAt: -1 };

    const skip = (page - 1) * limit;

    // Filter out moderated or hidden reviews
    const filter = {
      storeId: storeObjectId,
      status: 'VISIBLE',
    };

    const [reviews, total, distributionAgg] = await Promise.all([
      RatingModel.find(filter)
        .populate('userId', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      RatingModel.countDocuments(filter),
      RatingModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$value',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Build complete distribution from 1 to 5 stars
    const distribution: Record<number, { count: number; percentage: number }> = {
      1: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      5: { count: 0, percentage: 0 },
    };

    distributionAgg.forEach((d: { _id: number; count: number }) => {
      if (distribution[d._id]) {
        distribution[d._id].count = d.count;
        distribution[d._id].percentage = total > 0 ? Math.round((d.count / total) * 100) : 0;
      }
    });

    const items = reviews.map((r: any) => ({
      id: r._id.toString(),
      value: r.value,
      comment: r.comment || '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      helpfulCount: r.helpfulCount || 0,
      hasVotedHelpful: currentUserId
        ? (r.helpfulVotes || []).some((v: any) => v.toString() === currentUserId)
        : false,
      user: {
        id: r.userId?._id?.toString() || '',
        name: r.userId?.name || 'Anonymous User',
      },
    }));

    return {
      reviews: items,
      distribution,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Toggle helpful vote on a review
   */
  static async toggleHelpfulVote(ratingId: string, userId: string) {
    if (!mongoose.isValidObjectId(ratingId)) {
      const error: any = new Error('Invalid review ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const rating = await RatingModel.findOne({
      _id: new mongoose.Types.ObjectId(ratingId),
      status: 'VISIBLE',
    });

    if (!rating) {
      const error: any = new Error('Review not found or not visible');
      error.statusCode = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }

    // Policy: Users cannot vote on their own review
    if (rating.userId.toString() === userId) {
      const error: any = new Error('You cannot vote on your own review');
      error.statusCode = 400;
      error.code = 'CANNOT_VOTE_OWN_REVIEW';
      throw error;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const hasVoted = rating.helpfulVotes.some((id) => id.toString() === userId);

    let updatedDoc;
    if (hasVoted) {
      // Remove helpful vote
      updatedDoc = await RatingModel.findByIdAndUpdate(
        ratingId,
        {
          $pull: { helpfulVotes: userObjId },
          $inc: { helpfulCount: -1 },
        },
        { new: true }
      );
    } else {
      // Add helpful vote
      updatedDoc = await RatingModel.findByIdAndUpdate(
        ratingId,
        {
          $addToSet: { helpfulVotes: userObjId },
          $inc: { helpfulCount: 1 },
        },
        { new: true }
      );
    }

    return {
      ratingId,
      helpfulCount: Math.max(0, updatedDoc?.helpfulCount || 0),
      hasVotedHelpful: !hasVoted,
    };
  }

  /**
   * Report an inappropriate or abusive review
   */
  static async reportReview(
    ratingId: string,
    reporterId: string,
    reason: ReportReason,
    details?: string | null
  ) {
    if (!mongoose.isValidObjectId(ratingId)) {
      const error: any = new Error('Invalid review ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const rating = await RatingModel.findById(ratingId);
    if (!rating || rating.status === 'HIDDEN') {
      const error: any = new Error('Review not found or has already been moderated');
      error.statusCode = 404;
      error.code = 'REVIEW_NOT_FOUND';
      throw error;
    }

    if (rating.userId.toString() === reporterId) {
      const error: any = new Error('You cannot report your own review');
      error.statusCode = 400;
      error.code = 'CANNOT_REPORT_OWN_REVIEW';
      throw error;
    }

    const existingReport = await ReportModel.findOne({
      ratingId: new mongoose.Types.ObjectId(ratingId),
      reporterId: new mongoose.Types.ObjectId(reporterId),
    });

    if (existingReport) {
      const error: any = new Error('You have already submitted a report for this review');
      error.statusCode = 409;
      error.code = 'DUPLICATE_REPORT';
      throw error;
    }

    const report = await ReportModel.create({
      ratingId: new mongoose.Types.ObjectId(ratingId),
      reporterId: new mongoose.Types.ObjectId(reporterId),
      reason,
      details: sanitizeText(details || '') || '',
      status: 'PENDING',
    });

    // Mark review as FLAGGED
    await RatingModel.updateOne({ _id: ratingId }, { $set: { status: 'FLAGGED' } });

    return {
      reportId: report._id.toString(),
      ratingId,
      status: 'PENDING',
      message: 'Report submitted successfully. Our moderation team will review it.',
    };
  }

  /**
   * Get user's rating history across all stores (R4)
   */
  static async getMyRatingHistory(userId: string, page: number = 1, limit: number = 20) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      RatingModel.find({ userId: userObjectId })
        .populate('storeId', 'name address category city averageRating ratingCount coordinates')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RatingModel.countDocuments({ userId: userObjectId }),
    ]);

    const formatted = ratings.map((r: any) => ({
      id: r._id.toString(),
      storeId: r.storeId?._id?.toString() || r.storeId?.toString(),
      storeName: r.storeId?.name || 'Unknown Store',
      storeAddress: r.storeId?.address || '',
      storeCategory: r.storeId?.category || 'Retail',
      storeCity: r.storeId?.city || 'General',
      storeAverageRating: r.storeId?.averageRating || 0,
      storeRatingCount: r.storeId?.ratingCount || 0,
      value: r.value,
      comment: r.comment || '',
      status: r.status,
      helpfulCount: r.helpfulCount || 0,
      ownerReply: r.ownerReply || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return {
      ratings: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
