import mongoose from 'mongoose';
import { StoreModel } from '../models/store.model';
import { RatingModel } from '../models/rating.model';
import { UserModel } from '../models/user.model';
import {
  OwnerRatingsQueryInput,
  OwnerAnalyticsQueryInput,
  CreateStoreInput,
  UpdateStoreInput,
  OwnerStoreQueryInput,
} from '../validators/store.validator';
import { notificationService } from './notification.service';
import { sanitizeText } from '../utils/sanitize';

function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).replace(/[\r\n]+/g, ' ');
  // Prevent formula injection in Excel / Google Sheets
  if (/^[=\+\-@\t]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export class OwnerService {
  /**
   * Get basic dashboard overview for store owner
   */
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

    // Aggregated stats across all owned stores (only VISIBLE reviews)
    const [overallStats] = await RatingModel.aggregate([
      { $match: { storeId: { $in: storeIds }, status: 'VISIBLE' } },
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
      { $match: { storeId: { $in: storeIds }, status: 'VISIBLE' } },
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
      { $match: { storeId: { $in: storeIds }, status: 'VISIBLE' } },
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
        coverImage: store.coverImage,
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

  /**
   * Get advanced analytics with date ranges, trends, and store comparisons
   */
  static async getAnalytics(ownerId: string, query: OwnerAnalyticsQueryInput) {
    const { storeId, startDate, endDate, rating } = query;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // Verify authorized stores
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
        const error: any = new Error('Store not found or unauthorized');
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
        totalStores: 0,
        totalRatings: 0,
        averageRating: 0,
        periodNewRatings: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        dailyTrends: [],
        storeComparisons: [],
      };
    }

    // Match conditions
    const matchFilter: any = {
      storeId: { $in: targetStoreIds },
      status: 'VISIBLE',
    };

    if (rating && rating >= 1 && rating <= 5) {
      matchFilter.value = rating;
    }

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }

    // Parallel aggregations for performance
    const [overallStats, distributionAgg, trendsAgg, storeComparisonsAgg] = await Promise.all([
      RatingModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalRatings: { $sum: 1 },
            averageRating: { $avg: '$value' },
          },
        },
      ]),
      RatingModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$value',
            count: { $sum: 1 },
          },
        },
      ]),
      // Daily trend aggregation
      RatingModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            averageRating: { $avg: '$value' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Store comparison aggregation
      RatingModel.aggregate([
        { $match: matchFilter },
        {
          $lookup: {
            from: 'stores',
            localField: 'storeId',
            foreignField: '_id',
            as: 'store',
          },
        },
        { $unwind: '$store' },
        {
          $group: {
            _id: '$storeId',
            storeName: { $first: '$store.name' },
            count: { $sum: 1 },
            averageRating: { $avg: '$value' },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distributionAgg) {
      if (d._id >= 1 && d._id <= 5) {
        distribution[d._id] = d.count;
      }
    }

    const dailyTrends = trendsAgg.map((t) => ({
      date: t._id,
      count: t.count,
      averageRating: Math.round(t.averageRating * 10) / 10,
    }));

    const storeComparisons = storeComparisonsAgg.map((s) => ({
      storeId: s._id.toString(),
      storeName: s.storeName,
      ratingCount: s.count,
      averageRating: Math.round(s.averageRating * 10) / 10,
    }));

    return {
      totalStores: targetStoreIds.length,
      totalRatings: overallStats[0]?.totalRatings || 0,
      averageRating: overallStats[0] ? Math.round(overallStats[0].averageRating * 10) / 10 : 0,
      periodNewRatings: overallStats[0]?.totalRatings || 0,
      distribution,
      dailyTrends,
      storeComparisons,
    };
  }

  /**
   * Get ratings list for store owner
   */
  static async getOwnerRatings(ownerId: string, query: OwnerRatingsQueryInput) {
    const { storeId, page, limit, search, rating, startDate, endDate, sort, order } = query;
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
      status: 'VISIBLE',
    };

    if (rating && rating >= 1 && rating <= 5) {
      matchStage.value = rating;
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

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
            { comment: { $regex: search, $options: 'i' } },
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
                comment: 1,
                status: 1,
                helpfulCount: 1,
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
      comment: r.comment || '',
      helpfulCount: r.helpfulCount || 0,
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

  /**
   * Export owner ratings to CSV with formula injection defense
   */
  static async exportRatingsCsv(ownerId: string, query: OwnerRatingsQueryInput): Promise<string> {
    const { storeId, search, rating, startDate, endDate } = query;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    let targetStoreIds: mongoose.Types.ObjectId[] = [];
    if (storeId) {
      if (!mongoose.isValidObjectId(storeId)) {
        throw new Error('Invalid store ID');
      }
      const store = await StoreModel.findOne({
        _id: new mongoose.Types.ObjectId(storeId),
        ownerId: ownerObjectId,
        isActive: true,
      });
      if (!store) throw new Error('Store not found or unauthorized');
      targetStoreIds = [store._id];
    } else {
      const stores = await StoreModel.find({ ownerId: ownerObjectId, isActive: true });
      targetStoreIds = stores.map((s) => s._id);
    }

    if (targetStoreIds.length === 0) {
      return 'Store Name,Customer Name,Customer Email,Rating,Comment,Helpful Votes,Date\n';
    }

    const matchStage: any = {
      storeId: { $in: targetStoreIds },
      status: 'VISIBLE',
    };

    if (rating && rating >= 1 && rating <= 5) {
      matchStage.value = rating;
    }

    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    if (Object.keys(dateFilter).length > 0) {
      matchStage.createdAt = dateFilter;
    }

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
            { comment: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $limit: 10000 } // Safe upper limit for export
    );

    const rows = await RatingModel.aggregate(pipeline);

    const headers = ['Store Name', 'Customer Name', 'Customer Email', 'Rating', 'Comment', 'Helpful Votes', 'Date'];
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const line = [
        sanitizeCsvCell(row.store.name),
        sanitizeCsvCell(row.user.name),
        sanitizeCsvCell(row.user.email),
        sanitizeCsvCell(row.value),
        sanitizeCsvCell(row.comment || ''),
        sanitizeCsvCell(row.helpfulCount || 0),
        sanitizeCsvCell(new Date(row.createdAt).toISOString()),
      ];
      csvLines.push(line.join(','));
    }

    return csvLines.join('\n');
  }

  /**
   * Submit or update an owner reply to a customer rating
   */
  static async replyToRating(ownerId: string, ratingId: string, replyText: string) {
    if (!mongoose.isValidObjectId(ratingId)) {
      const err: any = new Error('Invalid rating ID format');
      err.statusCode = 400;
      throw err;
    }

    const cleanText = sanitizeText(replyText || '');
    if (!cleanText || cleanText.length < 1 || cleanText.length > 1000) {
      const err: any = new Error('Reply text must be between 1 and 1000 characters');
      err.statusCode = 400;
      throw err;
    }

    const rating = await RatingModel.findById(ratingId);
    if (!rating) {
      const err: any = new Error('Rating not found');
      err.statusCode = 404;
      throw err;
    }

    // Verify the rating belongs to a store owned by this owner
    const store = await StoreModel.findById(rating.storeId);
    if (!store || !store.ownerId || store.ownerId.toString() !== ownerId) {
      const err: any = new Error('Forbidden: You can only reply to reviews for your own stores');
      err.statusCode = 403;
      throw err;
    }

    rating.ownerReply = {
      text: cleanText,
      createdAt: rating.ownerReply?.createdAt || new Date(),
      updatedAt: new Date(),
      ownerId: new mongoose.Types.ObjectId(ownerId),
    };

    await rating.save();

    // Trigger in-app notification to the reviewer (N1)
    await notificationService.createNotification(
      rating.userId,
      'REVIEW_REPLY',
      'Store Owner Replied to Your Review',
      `The owner of ${store.name} replied to your review: "${cleanText.substring(0, 80)}${cleanText.length > 80 ? '...' : ''}"`,
      `/stores/${store._id}`
    );

    return {
      id: rating._id.toString(),
      ownerReply: rating.ownerReply,
      message: 'Reply posted successfully',
    };
  }

  /**
   * Delete an owner reply to a customer rating
   */
  static async deleteReply(ownerId: string, ratingId: string) {
    if (!mongoose.isValidObjectId(ratingId)) {
      const err: any = new Error('Invalid rating ID format');
      err.statusCode = 400;
      throw err;
    }

    const rating = await RatingModel.findById(ratingId);
    if (!rating) {
      const err: any = new Error('Rating not found');
      err.statusCode = 404;
      throw err;
    }

    const store = await StoreModel.findById(rating.storeId);
    if (!store || !store.ownerId || store.ownerId.toString() !== ownerId) {
      const err: any = new Error('Forbidden: You can only delete replies for your own stores');
      err.statusCode = 403;
      throw err;
    }

    await RatingModel.updateOne({ _id: ratingId }, { $unset: { ownerReply: 1 } });

    return { message: 'Reply deleted successfully' };
  }

  /**
   * Create a new store owned by the authenticated store owner
   */
  static async createStore(ownerId: string, input: CreateStoreInput) {
    if (!mongoose.isValidObjectId(ownerId)) {
      const err: any = new Error('Invalid owner ID format');
      err.statusCode = 400;
      throw err;
    }

    const owner = await UserModel.findById(ownerId);
    if (!owner || owner.role !== 'STORE_OWNER') {
      const err: any = new Error('Forbidden: Only registered Store Owners can create stores');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const newStore = await StoreModel.create({
      name: sanitizeText(input.name) || input.name.trim(),
      email: input.email ? input.email.trim().toLowerCase() : '',
      address: input.address.trim(),
      category: input.category ? input.category.trim() : 'Retail',
      city: input.city ? input.city.trim() : 'Pune',
      state: input.state ? input.state.trim() : 'Maharashtra',
      description: sanitizeText(input.description) || '',
      phone: sanitizeText(input.phone) || '',
      website: sanitizeText(input.website) || '',
      coverImage: input.coverImage ? input.coverImage.trim() : '',
      coordinates: input.coordinates,
      ownerId: new mongoose.Types.ObjectId(ownerId),
      isActive: true,
      isDemo: false,
      averageRating: 0,
      ratingCount: 0,
    });

    return {
      store: {
        id: newStore._id.toString(),
        name: newStore.name,
        email: newStore.email,
        address: newStore.address,
        category: newStore.category,
        city: newStore.city,
        state: newStore.state,
        description: newStore.description,
        phone: newStore.phone,
        website: newStore.website,
        coverImage: newStore.coverImage,
        coordinates: newStore.coordinates,
        isActive: newStore.isActive,
        createdAt: newStore.createdAt,
        updatedAt: newStore.updatedAt,
        ratingCount: 0,
        averageRating: 0,
      },
      message: 'Store created successfully',
    };
  }

  /**
   * Get all stores owned by the authenticated owner with optional filters and pagination
   */
  static async getOwnerStores(ownerId: string, query: Partial<OwnerStoreQueryInput> = {}) {
    if (!mongoose.isValidObjectId(ownerId)) {
      const err: any = new Error('Invalid owner ID format');
      err.statusCode = 400;
      throw err;
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    const matchQuery: any = { ownerId: ownerObjectId };

    if (query.status === 'archived') {
      matchQuery.isActive = false;
    } else if (query.status === 'all') {
      // Return both active and archived
    } else {
      // Default: active only
      matchQuery.isActive = true;
    }

    if (query.search) {
      matchQuery.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { address: { $regex: query.search, $options: 'i' } },
        { city: { $regex: query.search, $options: 'i' } },
        { category: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.category) {
      matchQuery.category = query.category;
    }

    if (query.city) {
      matchQuery.city = query.city;
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortField = query.sort || 'createdAt';
    const sortDir = query.order === 'asc' ? 1 : -1;

    const [total, stores] = await Promise.all([
      StoreModel.countDocuments(matchQuery),
      StoreModel.find(matchQuery)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const storeIds = stores.map((s) => s._id);

    // Compute live visible ratings statistics for each store
    const perStoreAgg = await RatingModel.aggregate([
      { $match: { storeId: { $in: storeIds }, status: 'VISIBLE' } },
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

    const formattedStores = stores.map((store) => {
      const stats = statsByStoreId.get(store._id.toString()) || {
        totalRatings: store.ratingCount || 0,
        averageRating: store.averageRating || 0,
      };
      return {
        id: store._id.toString(),
        name: store.name,
        email: store.email,
        address: store.address,
        category: store.category,
        city: store.city,
        state: store.state,
        description: store.description,
        phone: store.phone,
        website: store.website,
        coverImage: store.coverImage,
        coordinates: store.coordinates,
        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        ratingCount: stats.totalRatings,
        averageRating: stats.averageRating,
      };
    });

    return {
      stores: formattedStores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single store details owned by the authenticated owner
   */
  static async getOwnerStoreById(ownerId: string, storeId: string) {
    if (!mongoose.isValidObjectId(storeId)) {
      const err: any = new Error('Invalid store ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID';
      throw err;
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      const err: any = new Error('Store not found');
      err.statusCode = 404;
      err.code = 'STORE_NOT_FOUND';
      throw err;
    }

    if (!store.ownerId || store.ownerId.toString() !== ownerId) {
      const err: any = new Error('Forbidden: You do not have permission to view or manage this store');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Compute live rating statistics
    const [ratingStats] = await RatingModel.aggregate([
      { $match: { storeId: store._id, status: 'VISIBLE' } },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$value' },
        },
      },
    ]);

    return {
      store: {
        id: store._id.toString(),
        name: store.name,
        email: store.email,
        address: store.address,
        category: store.category,
        city: store.city,
        state: store.state,
        description: store.description,
        phone: store.phone,
        website: store.website,
        coverImage: store.coverImage,
        coordinates: store.coordinates,
        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        ratingCount: ratingStats?.totalRatings || store.ratingCount || 0,
        averageRating: ratingStats ? Math.round(ratingStats.averageRating * 10) / 10 : store.averageRating || 0,
      },
    };
  }

  /**
   * Update store profile details with ownership enforcement and mass-assignment protection
   */
  static async updateOwnerStore(ownerId: string, storeId: string, updateData: UpdateStoreInput) {
    if (!mongoose.isValidObjectId(storeId)) {
      const err: any = new Error('Invalid store ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID';
      throw err;
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      const err: any = new Error('Store not found');
      err.statusCode = 404;
      err.code = 'STORE_NOT_FOUND';
      throw err;
    }

    if (!store.ownerId || store.ownerId.toString() !== ownerId) {
      const err: any = new Error('Forbidden: You can only edit your own store');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    if (updateData.name !== undefined && updateData.name.trim()) store.name = sanitizeText(updateData.name) || updateData.name.trim();
    if (updateData.description !== undefined) store.description = sanitizeText(updateData.description) || '';
    if (updateData.phone !== undefined) store.phone = sanitizeText(updateData.phone) || '';
    if (updateData.email !== undefined) store.email = updateData.email ? updateData.email.trim().toLowerCase() : '';
    if (updateData.website !== undefined) store.website = sanitizeText(updateData.website) || '';
    if (updateData.address !== undefined && updateData.address.trim()) store.address = updateData.address.trim();
    if (updateData.category !== undefined && updateData.category.trim()) store.category = updateData.category.trim();
    if (updateData.city !== undefined && updateData.city.trim()) store.city = updateData.city.trim();
    if (updateData.state !== undefined && updateData.state.trim()) store.state = updateData.state.trim();
    if (updateData.coverImage !== undefined) store.coverImage = updateData.coverImage.trim();
    if (updateData.coordinates !== undefined) store.coordinates = updateData.coordinates;

    await store.save();

    return {
      store: {
        id: store._id.toString(),
        name: store.name,
        email: store.email,
        address: store.address,
        category: store.category,
        city: store.city,
        state: store.state,
        description: store.description,
        phone: store.phone,
        website: store.website,
        coverImage: store.coverImage,
        coordinates: store.coordinates,
        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        ratingCount: store.ratingCount || 0,
        averageRating: store.averageRating || 0,
      },
      message: 'Store details updated successfully',
    };
  }

  /**
   * Soft-delete / archive store while preserving rating history and referential integrity
   */
  static async deleteOwnerStore(ownerId: string, storeId: string) {
    if (!mongoose.isValidObjectId(storeId)) {
      const err: any = new Error('Invalid store ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID';
      throw err;
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      const err: any = new Error('Store not found');
      err.statusCode = 404;
      err.code = 'STORE_NOT_FOUND';
      throw err;
    }

    if (!store.ownerId || store.ownerId.toString() !== ownerId) {
      const err: any = new Error('Forbidden: You can only delete your own store');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Soft delete: sets isActive to false
    store.isActive = false;
    await store.save();

    return {
      storeId: store._id.toString(),
      message: 'Store archived successfully. Historical ratings and reviews have been preserved.',
    };
  }

  /**
   * Backward-compatible alias for store profile updating (O2)
   */
  static async updateStoreProfile(
    ownerId: string,
    storeId: string,
    updateData: UpdateStoreInput
  ) {
    return this.updateOwnerStore(ownerId, storeId, updateData);
  }
}

