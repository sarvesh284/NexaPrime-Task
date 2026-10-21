import mongoose from 'mongoose';
import { RatingModel } from '../models/rating.model';
import { StoreModel } from '../models/store.model';

export class RatingService {
  static async submitOrUpdateRating(userId: string, storeId: string, value: number) {
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

    // Concurrency-safe atomic upsert
    let ratingDoc;
    try {
      ratingDoc = await RatingModel.findOneAndUpdate(
        { userId: userObjectId, storeId: storeObjectId },
        { $set: { value } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (err: any) {
      // If unique index race condition occurs during concurrent insert
      if (err.code === 11000) {
        ratingDoc = await RatingModel.findOneAndUpdate(
          { userId: userObjectId, storeId: storeObjectId },
          { $set: { value } },
          { new: true, runValidators: true }
        );
      } else {
        throw err;
      }
    }

    // Calculate updated aggregates for immediate feedback
    const [stats] = await RatingModel.aggregate([
      { $match: { storeId: storeObjectId } },
      {
        $group: {
          _id: '$storeId',
          averageRating: { $avg: '$value' },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    return {
      rating: {
        id: ratingDoc?._id.toString(),
        userId: userId,
        storeId: storeId,
        value: ratingDoc?.value,
        updatedAt: ratingDoc?.updatedAt,
      },
      storeStats: {
        storeId,
        averageRating: stats ? Math.round(stats.averageRating * 10) / 10 : 0,
        ratingCount: stats?.ratingCount || 0,
      },
    };
  }

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
      updatedAt: rating ? rating.updatedAt : null,
    };
  }
}
