import mongoose from 'mongoose';
import { StoreModel } from '../models/store.model';
import { RatingModel } from '../models/rating.model';
import { OwnerRatingsQueryInput } from '../validators/store.validator';

export class OwnerService {
  static async getDashboard(ownerId: string) {
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Fetch all active stores owned by this owner
    const stores = await StoreModel.find({ ownerId: ownerObjectId, isActive: true });
    const storeIds = stores.map((s) => s._id);

    if (storeIds.length === 0) {
      return {
        totalStores: 0,
        totalRatings: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        stores: [],
      };
    }

    // Aggregated stats across all owned stores
    const [overallStats] = await RatingModel.aggregate([
      { $match: { storeId: { $in: storeIds } } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$value' },
        },
      },
    ]);

    // Star rating distribution (1 to 5)
    const distributionAgg = await RatingModel.aggregate([
      { $match: { storeId: { $in: storeIds } } },
      {
        $group: {
          _id: '$value',
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distributionAgg) {
      if (d._id >= 1 && d._id <= 5) {
        distribution[d._id] = d.count;
      }
    }

    // Per-store breakdown
    const perStoreAgg = await RatingModel.aggregate([
      { $match: { storeId: { $in: storeIds } } },
      {
        $group: {
          _id: '$storeId',
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$value' },
        },
      },
    ]);

    const statsByStoreId = new Map(
      perStoreAgg.map((item) => [
        item._id.toString(),
        {
          totalRatings: item.totalRatings,
          averageRating: Math.round(item.averageRating * 10) / 10,
        },
      ])
    );

    const storeSummaries = stores.map((store) => {
      const stats = statsByStoreId.get(store._id.toString()) || {
        totalRatings: 0,
        averageRating: 0,
      };
      return {
        id: store._id.toString(),
        name: store.name,
        address: store.address,
        createdAt: store.createdAt,
        totalRatings: stats.totalRatings,
        averageRating: stats.averageRating,
      };
    });

    return {
      totalStores: stores.length,
      totalRatings: overallStats?.totalRatings || 0,
      averageRating: overallStats ? Math.round(overallStats.averageRating * 10) / 10 : 0,
      distribution,
      stores: storeSummaries,
    };
  }

  static async getOwnerRatings(ownerId: string, query: OwnerRatingsQueryInput) {
    const { storeId, page, limit, search, sort, order } = query;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Verify stores owned by this owner
    let targetStoreIds: mongoose.Types.ObjectId[] = [];

    if (storeId) {
      if (!mongoose.isValidObjectId(storeId)) {
        const error: any = new Error('Invalid store ID format');
        error.statusCode = 400;
        error.code = 'INVALID_ID';
        throw error;
      }
      const store = await StoreModel.findOne({
        _id: new mongoose.Types.ObjectId(storeId),
        ownerId: ownerObjectId,
        isActive: true,
      });

      if (!store) {
        const error: any = new Error('Store not found or you do not have permission to view it');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }
      targetStoreIds = [store._id];
    } else {
      const stores = await StoreModel.find({ ownerId: ownerObjectId, isActive: true });
      targetStoreIds = stores.map((s) => s._id);
    }

    if (targetStoreIds.length === 0) {
      return {
        ratings: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 1,
        },
      };
    }

    const sortDir = order === 'asc' ? 1 : -1;
    const sortField: Record<string, 1 | -1> = {};
    if (sort === 'value') {
      sortField.value = sortDir;
    } else if (sort === 'updatedAt') {
      sortField.updatedAt = sortDir;
    } else if (sort === 'storeName') {
      sortField['store.name'] = sortDir;
    } else {
      sortField.createdAt = sortDir;
    }

    const matchStage: any = {
      storeId: { $in: targetStoreIds },
    };

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'stores',
          localField: 'storeId',
          foreignField: '_id',
          as: 'store',
        },
      },
      { $unwind: '$store' },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'store.name': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: sortField },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                id: '$_id',
                value: 1,
                createdAt: 1,
                updatedAt: 1,
                user: {
                  id: '$user._id',
                  name: '$user.name',
                  email: '$user.email',
                },
                store: {
                  id: '$store._id',
                  name: '$store.name',
                },
              },
            },
          ],
        },
      }
    );

    const [result] = await RatingModel.aggregate(pipeline);
    const total = result?.metadata[0]?.total || 0;
    const ratings = (result?.data || []).map((r: any) => ({
      id: r._id?.toString() || r.id?.toString(),
      rating: r.value,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: {
        id: r.user.id?.toString(),
        name: r.user.name,
        email: r.user.email,
      },
      store: {
        id: r.store.id?.toString(),
        name: r.store.name,
      },
    }));

    return {
      ratings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
