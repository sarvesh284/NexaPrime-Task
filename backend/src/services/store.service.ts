import mongoose from 'mongoose';
import { StoreModel } from '../models/store.model';
import { UserModel } from '../models/user.model';
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
}
