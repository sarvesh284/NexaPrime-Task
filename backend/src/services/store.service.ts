import mongoose from 'mongoose';
import { StoreModel } from '../models/store.model';
import { StoreQueryInput } from '../validators/store.validator';

export class StoreService {
  static async getStores(query: StoreQueryInput, currentUserId?: string) {
    const { page, limit, search, sort, order } = query;
    const matchStage: any = { isActive: true };

    if (search) {
      matchStage.name = { $regex: search, $options: 'i' };
    }

    const sortStage: Record<string, 1 | -1> = {};
    const dir = order === 'asc' ? 1 : -1;
    if (sort === 'averageRating') {
      sortStage.averageRating = dir;
    } else if (sort === 'ratingCount') {
      sortStage.ratingCount = dir;
    } else if (sort === 'createdAt') {
      sortStage.createdAt = dir;
    } else {
      sortStage.name = dir;
    }

    const userObjectId = currentUserId && mongoose.isValidObjectId(currentUserId)
      ? new mongoose.Types.ObjectId(currentUserId)
      : null;

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'storeId',
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
      { $sort: sortStage },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                id: '$_id',
                name: 1,
                address: 1,
                ownerId: 1,
                isActive: 1,
                createdAt: 1,
                updatedAt: 1,
                ratingCount: 1,
                averageRating: 1,
                myRating: 1,
              },
            },
          ],
        },
      },
    ];

    const [result] = await StoreModel.aggregate(pipeline);
    const total = result.metadata[0]?.total || 0;
    const stores = result.data.map((item: any) => ({
      ...item,
      id: item._id?.toString() || item.id?.toString(),
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

    const pipeline: any[] = [
      { $match: { _id: storeObjectId, isActive: true } },
      {
        $lookup: {
          from: 'ratings',
          localField: '_id',
          foreignField: 'storeId',
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
    };
  }
}
