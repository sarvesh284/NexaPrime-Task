import mongoose from 'mongoose';
import { StoreModel } from '../models/store.model';
import { UserModel } from '../models/user.model';
import { RatingModel } from '../models/rating.model';
import { StoreQueryInput } from '../validators/store.validator';
import { env } from '../config/env';

export class StoreService {
  /**
   * Get public stores with filters (category, city, minRating, minReviews),
   * Bayesian rating calculation, and user-specific favorites/ratings.
   */
  static async getStores(query: StoreQueryInput, currentUserId?: string) {
    const { page, limit, search, category, city, minRating, minReviews, sort, order } = query;
    const matchStage: any = { isActive: true };

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      matchStage.category = category;
    }

    if (city) {
      matchStage.city = city;
    }

    const userObjectId = currentUserId && mongoose.isValidObjectId(currentUserId)
      ? new mongoose.Types.ObjectId(currentUserId)
      : null;

    // Fetch user favorites if logged in
    let userFavorites: string[] = [];
    if (userObjectId) {
      const user = await UserModel.findById(userObjectId, 'favorites').lean();
      if (user && user.favorites) {
        userFavorites = user.favorites.map((f: any) => f.toString());
      }
    }

    const m = env.BAYESIAN_MIN_RATINGS || 5;
    const C = env.BAYESIAN_PRIOR_RATING || 3.0;

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'ratings',
          let: { sId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$storeId', '$$sId'] },
                    { $eq: ['$status', 'VISIBLE'] },
                  ],
                },
              },
            },
          ],
          as: 'ratings',
        },
      },
      {
        $addFields: {
          ratingCount: { $size: '$ratings' },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$ratings' }, 0] },
              then: { $round: [{ $avg: '$ratings.value' }, 1] },
              else: 0,
            },
          },
          myRating: userObjectId
            ? {
                $let: {
                  vars: {
                    userRatingDoc: {
                      $filter: {
                        input: '$ratings',
                        as: 'r',
                        cond: { $eq: ['$$r.userId', userObjectId] },
                      },
                    },
                  },
                  in: {
                    $cond: {
                      if: { $gt: [{ $size: '$$userRatingDoc' }, 0] },
                      then: { $arrayElemAt: ['$$userRatingDoc.value', 0] },
                      else: null,
                    },
                  },
                },
              }
            : null,
        },
      },
      // Calculate Bayesian adjusted score
      {
        $addFields: {
          bayesianRating: {
            $cond: {
              if: { $gt: ['$ratingCount', 0] },
              then: {
                $round: [
                  {
                    $add: [
                      {
                        $multiply: [
                          { $divide: ['$ratingCount', { $add: ['$ratingCount', m] }] },
                          '$averageRating',
                        ],
                      },
                      {
                        $multiply: [
                          { $divide: [m, { $add: ['$ratingCount', m] }] },
                          C,
                        ],
                      },
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ];

    // Filter by minRating or minReviews if provided
    const postFilter: any = {};
    if (minRating !== undefined && minRating > 0) {
      postFilter.averageRating = { $gte: minRating };
    }
    if (minReviews !== undefined && minReviews > 0) {
      postFilter.ratingCount = { $gte: minReviews };
    }
    if (Object.keys(postFilter).length > 0) {
      pipeline.push({ $match: postFilter });
    }

    pipeline.push({
      $project: {
        ratings: 0,
      },
    });

    const sortStage: Record<string, 1 | -1> = {};
    const dir = order === 'asc' ? 1 : -1;
    if (sort === 'averageRating') {
      sortStage.averageRating = dir;
    } else if (sort === 'ratingCount') {
      sortStage.ratingCount = dir;
    } else if (sort === 'bayesianRating') {
      sortStage.bayesianRating = dir;
    } else if (sort === 'createdAt') {
      sortStage.createdAt = dir;
    } else {
      sortStage.name = dir;
    }
    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              id: '$_id',
              name: 1,
              email: 1,
              address: 1,
              category: 1,
              city: 1,
              ownerId: 1,
              isActive: 1,
              createdAt: 1,
              updatedAt: 1,
              ratingCount: 1,
              averageRating: 1,
              bayesianRating: 1,
              myRating: 1,
            },
          },
        ],
      },
    });

    const [result] = await StoreModel.aggregate(pipeline);
    const total = result.metadata[0]?.total || 0;
    const stores = result.data.map((item: any) => ({
      ...item,
      id: item._id?.toString() || item.id?.toString(),
      isFavorite: userFavorites.includes(item._id?.toString() || item.id?.toString()),
    }));

    return {
      stores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single store details by ID
   */
  static async getStoreById(storeId: string, currentUserId?: string) {
    if (!mongoose.isValidObjectId(storeId)) {
      const error: any = new Error('Invalid store ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const userObjectId = currentUserId && mongoose.isValidObjectId(currentUserId)
      ? new mongoose.Types.ObjectId(currentUserId)
      : null;

    let isFavorite = false;
    if (userObjectId) {
      const user = await UserModel.findById(userObjectId, 'favorites').lean();
      if (user && user.favorites) {
        isFavorite = user.favorites.some((f: any) => f.toString() === storeId);
      }
    }

    const pipeline: any[] = [
      { $match: { _id: storeObjectId, isActive: true } },
      {
        $lookup: {
          from: 'ratings',
          let: { sId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$storeId', '$$sId'] },
                    { $eq: ['$status', 'VISIBLE'] },
                  ],
                },
              },
            },
          ],
          as: 'ratings',
        },
      },
      {
        $addFields: {
          ratingCount: { $size: '$ratings' },
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$ratings' }, 0] },
              then: { $round: [{ $avg: '$ratings.value' }, 1] },
              else: 0,
            },
          },
          myRating: userObjectId
            ? {
                $let: {
                  vars: {
                    userRatingDoc: {
                      $filter: {
                        input: '$ratings',
                        as: 'r',
                        cond: { $eq: ['$$r.userId', userObjectId] },
                      },
                    },
                  },
                  in: {
                    $cond: {
                      if: { $gt: [{ $size: '$$userRatingDoc' }, 0] },
                      then: { $arrayElemAt: ['$$userRatingDoc.value', 0] },
                      else: null,
                    },
                  },
                },
              }
            : null,
        },
      },
      {
        $project: {
          ratings: 0,
        },
      },
    ];

    const [store] = await StoreModel.aggregate(pipeline);
    if (!store) {
      const error: any = new Error('Store not found or is currently inactive');
      error.statusCode = 404;
      error.code = 'STORE_NOT_FOUND';
      throw error;
    }

    return {
      ...store,
      id: store._id.toString(),
      isFavorite,
    };
  }

  /**
   * Toggle favorite/wishlist status for a store
   */
  static async toggleFavorite(userId: string, storeId: string) {
    if (!mongoose.isValidObjectId(storeId)) {
      const error: any = new Error('Invalid store ID format');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const store = await StoreModel.findOne({ _id: storeObjectId, isActive: true });
    if (!store) {
      const error: any = new Error('Store not found or is inactive');
      error.statusCode = 404;
      error.code = 'STORE_NOT_FOUND';
      throw error;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const isFav = user.favorites.some((f) => f.toString() === storeId);
    if (isFav) {
      await UserModel.updateOne(
        { _id: userId },
        { $pull: { favorites: storeObjectId } }
      );
      return { storeId, isFavorite: false, message: 'Removed from favorites' };
    } else {
      await UserModel.updateOne(
        { _id: userId },
        { $addToSet: { favorites: storeObjectId } }
      );
      return { storeId, isFavorite: true, message: 'Added to favorites' };
    }
  }

  /**
   * Get user's favorited stores
   */
  static async getUserFavorites(userId: string) {
    const user = await UserModel.findById(userId).populate({
      path: 'favorites',
      match: { isActive: true },
    }).lean();

    if (!user) {
      return { favorites: [] };
    }

    const stores = ((user.favorites || []) as any[]).map((s: any) => ({
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      address: s.address,
      category: s.category || 'Retail',
      city: s.city || 'General',
      averageRating: s.averageRating || 0,
      ratingCount: s.ratingCount || 0,
      isFavorite: true,
    }));

    return { favorites: stores };
  }

  /**
   * Get distinct categories and cities for filtering
   */
  static async getFilterOptions() {
    const [categories, cities] = await Promise.all([
      StoreModel.distinct('category', { isActive: true }),
      StoreModel.distinct('city', { isActive: true }),
    ]);

    return {
      categories: categories.filter(Boolean),
      cities: cities.filter(Boolean),
    };
  }

  /**
   * Get trending stores based on recent rating volume and score quality (N4)
   */
  static async getTrendingStores(limit: number = 6) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trendingAgg = await RatingModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: 'VISIBLE',
        },
      },
      {
        $group: {
          _id: '$storeId',
          recentRatingsCount: { $sum: 1 },
          recentAverageRating: { $avg: '$value' },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$recentRatingsCount', 0.6] },
              { $multiply: ['$recentAverageRating', 0.8] },
            ],
          },
        },
      },
      { $sort: { trendingScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },
      { $match: { 'store.isActive': true } },
    ]);

    if (trendingAgg.length === 0) {
      // Fallback to top rated active stores
      const topStores = await StoreModel.find({ isActive: true })
        .sort({ averageRating: -1, ratingCount: -1 })
        .limit(limit)
        .lean();

      return topStores.map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        address: s.address,
        category: s.category || 'Retail',
        city: s.city || 'General',
        averageRating: s.averageRating || 0,
        ratingCount: s.ratingCount || 0,
        coordinates: s.coordinates,
        recentRatingsCount: s.ratingCount || 0,
      }));
    }

    return trendingAgg.map((item: any) => ({
      id: item.store._id.toString(),
      name: item.store.name,
      email: item.store.email,
      address: item.store.address,
      category: item.store.category || 'Retail',
      city: item.store.city || 'General',
      averageRating: item.store.averageRating || 0,
      ratingCount: item.store.ratingCount || 0,
      coordinates: item.store.coordinates,
      recentRatingsCount: item.recentRatingsCount,
    }));
  }

  /**
   * Record a store in user's recently viewed list (N5)
   */
  static async recordRecentlyViewed(userId: string, storeId: string) {
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(storeId)) return;

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const storeObjectId = new mongoose.Types.ObjectId(storeId);

    await UserModel.updateOne(
      { _id: userObjectId },
      {
        $pull: { recentlyViewed: { storeId: storeObjectId } },
      }
    );

    await UserModel.updateOne(
      { _id: userObjectId },
      {
        $push: {
          recentlyViewed: {
            $each: [{ storeId: storeObjectId, viewedAt: new Date() }],
            $slice: -10,
          },
        },
      }
    );
  }

  /**
   * Get user's recently viewed stores (N5)
   */
  static async getRecentlyViewed(userId: string) {
    const user = await UserModel.findById(userId)
      .populate({
        path: 'recentlyViewed.storeId',
        match: { isActive: true },
      })
      .lean();

    if (!user || !user.recentlyViewed) {
      return { stores: [] };
    }

    const stores = user.recentlyViewed
      .filter((item: any) => item.storeId)
      .map((item: any) => {
        const s = item.storeId;
        return {
          id: s._id.toString(),
          name: s.name,
          email: s.email,
          address: s.address,
          category: s.category || 'Retail',
          city: s.city || 'General',
          averageRating: s.averageRating || 0,
          ratingCount: s.ratingCount || 0,
          coordinates: s.coordinates,
          viewedAt: item.viewedAt,
        };
      })
      .reverse();

    return { stores };
  }

  /**
   * Clear user's recently viewed stores history (N5)
   */
  static async clearRecentlyViewed(userId: string) {
    await UserModel.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { recentlyViewed: [] } }
    );
    return { message: 'Recently viewed history cleared' };
  }
}
