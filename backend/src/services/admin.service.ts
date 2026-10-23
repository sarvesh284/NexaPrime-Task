import mongoose from 'mongoose';
import { UserModel } from '../models/user.model';
import { StoreModel } from '../models/store.model';
import { RatingModel } from '../models/rating.model';
import { ReportModel } from '../models/report.model';
import { AuditLogModel } from '../models/auditLog.model';
import {
  AdminCreateStoreInput,
  AdminUpdateStoreInput,
} from '../validators/admin.validator';

export class AdminService {
  /**
   * Helper to write an audit log entry
   */
  static async logAction(
    actorId: string,
    actorEmail: string,
    actorRole: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata: Record<string, any> = {}
  ) {
    try {
      // Ensure no sensitive fields leak into audit logs
      const sanitizedMetadata = { ...metadata };
      delete sanitizedMetadata.password;
      delete sanitizedMetadata.token;
      delete sanitizedMetadata.jwt;
      delete sanitizedMetadata.secret;

      await AuditLogModel.create({
        actorId: new mongoose.Types.ObjectId(actorId),
        actorEmail,
        actorRole,
        action,
        targetType,
        targetId,
        metadata: sanitizedMetadata,
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  /**
   * Platform-wide KPIs for Admin Dashboard
   */
  static async getPlatformKpis() {
    const [
      totalUsers,
      totalStoreOwners,
      totalActiveStores,
      totalInactiveStores,
      ratingsAgg,
      pendingReportsCount,
    ] = await Promise.all([
      UserModel.countDocuments({ role: 'USER' }),
      UserModel.countDocuments({ role: 'STORE_OWNER' }),
      StoreModel.countDocuments({ isActive: true }),
      StoreModel.countDocuments({ isActive: false }),
      RatingModel.aggregate([
        { $match: { status: 'VISIBLE' } },
        {
          $group: {
            _id: null,
            totalRatings: { $sum: 1 },
            averageRating: { $avg: '$value' },
          },
        },
      ]),
      ReportModel.countDocuments({ status: 'PENDING' }),
    ]);

    const totalRatings = ratingsAgg[0]?.totalRatings || 0;
    const overallPlatformRating = ratingsAgg[0]
      ? Math.round(ratingsAgg[0].averageRating * 10) / 10
      : 0;

    return {
      totalUsers,
      totalStoreOwners,
      totalActiveStores,
      totalInactiveStores,
      totalStores: totalActiveStores + totalInactiveStores,
      totalRatings,
      overallPlatformRating,
      pendingReportsCount,
    };
  }

  /**
   * Platform-wide Analytics with trends, distributions, and top stores (A3)
   */
  static async getPlatformAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      userRegistrationsTrend,
      storeCreationsTrend,
      ratingTrends,
      mostRatedStores,
      highestRatedStores,
      distributionAgg,
      activeUsersCount,
      inactiveUsersCount,
      activeStoresCount,
      inactiveStoresCount,
    ] = await Promise.all([
      // Users registered in last 30 days grouped by day
      UserModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Stores created in last 30 days grouped by day
      StoreModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Ratings created in last 30 days grouped by day
      RatingModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'VISIBLE' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgRating: { $avg: '$value' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 5 most-rated stores
      StoreModel.find({ isActive: true })
        .sort({ ratingCount: -1 })
        .limit(5)
        .select('name category city averageRating ratingCount')
        .lean(),

      // Top 5 highest-rated stores (minimum 3 ratings threshold)
      StoreModel.find({ isActive: true, ratingCount: { $gte: 3 } })
        .sort({ averageRating: -1, ratingCount: -1 })
        .limit(5)
        .select('name category city averageRating ratingCount')
        .lean(),

      // Platform-wide rating distribution (1 to 5)
      RatingModel.aggregate([
        { $match: { status: 'VISIBLE' } },
        {
          $group: {
            _id: '$value',
            count: { $sum: 1 },
          },
        },
      ]),

      UserModel.countDocuments({ isActive: true }),
      UserModel.countDocuments({ isActive: false }),
      StoreModel.countDocuments({ isActive: true }),
      StoreModel.countDocuments({ isActive: false }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatings = 0;
    for (const item of distributionAgg) {
      if (item._id >= 1 && item._id <= 5) {
        distribution[item._id] = item.count;
        totalRatings += item.count;
      }
    }

    return {
      userGrowth: userRegistrationsTrend.map((d: any) => ({ date: d._id, count: d.count })),
      storeGrowth: storeCreationsTrend.map((d: any) => ({ date: d._id, count: d.count })),
      ratingTrends: ratingTrends.map((d: any) => ({
        date: d._id,
        count: d.count,
        averageRating: Math.round(d.avgRating * 10) / 10,
      })),
      mostRatedStores: mostRatedStores.map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        category: s.category,
        city: s.city,
        averageRating: s.averageRating,
        ratingCount: s.ratingCount,
      })),
      highestRatedStores: highestRatedStores.map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        category: s.category,
        city: s.city,
        averageRating: s.averageRating,
        ratingCount: s.ratingCount,
      })),
      distribution,
      totalRatings,
      accountHealth: {
        activeUsers: activeUsersCount,
        inactiveUsers: inactiveUsersCount,
        activeStores: activeStoresCount,
        inactiveStores: inactiveStoresCount,
      },
    };
  }

  /**
   * Paginated User Management
   */
  static async getUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sort?: string;
    order?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status === 'active') {
      filter.isActive = true;
    } else if (query.status === 'deactivated') {
      filter.isActive = false;
    }

    const sortDir = query.order === 'asc' ? 1 : -1;
    const sortField: Record<string, 1 | -1> = {};
    if (query.sort === 'name') sortField.name = sortDir;
    else if (query.sort === 'email') sortField.email = sortDir;
    else if (query.sort === 'role') sortField.role = sortDir;
    else sortField.createdAt = sortDir;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select('-password -passwordResetTokenHash -emailVerificationTokenHash')
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    return {
      users: users.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        address: u.address,
        role: u.role,
        isActive: u.isActive,
        isEmailVerified: u.isEmailVerified,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Toggle user account status (Deactivate / Reactivate)
   */
  static async toggleUserStatus(
    targetUserId: string,
    adminId: string,
    adminEmail: string
  ) {
    if (!mongoose.isValidObjectId(targetUserId)) {
      throw new Error('Invalid user ID');
    }

    if (targetUserId === adminId) {
      const error: any = new Error('You cannot deactivate your own admin account');
      error.statusCode = 400;
      throw error;
    }

    const user = await UserModel.findById(targetUserId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const newStatus = !user.isActive;
    user.isActive = newStatus;
    // Invalidate sessions immediately if deactivating
    if (!newStatus) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    await user.save();

    await this.logAction(
      adminId,
      adminEmail,
      'ADMIN',
      newStatus ? 'REACTIVATE_USER' : 'DEACTIVATE_USER',
      'USER',
      targetUserId,
      { targetEmail: user.email, targetRole: user.role, newStatus }
    );

    return {
      id: user._id.toString(),
      isActive: user.isActive,
      message: `User account has been ${newStatus ? 'reactivated' : 'deactivated'} successfully`,
    };
  }

  /**
   * Paginated Store Management for Admin
   */
  static async getStores(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
    sort?: string;
    order?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { address: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.status === 'active') {
      filter.isActive = true;
    } else if (query.status === 'inactive') {
      filter.isActive = false;
    }

    if (query.category) {
      filter.category = query.category;
    }

    const sortDir = query.order === 'asc' ? 1 : -1;
    const sortField: Record<string, 1 | -1> = {};
    if (query.sort === 'name') sortField.name = sortDir;
    else if (query.sort === 'averageRating') sortField.averageRating = sortDir;
    else if (query.sort === 'ratingCount') sortField.ratingCount = sortDir;
    else sortField.createdAt = sortDir;

    const skip = (page - 1) * limit;

    const [stores, total] = await Promise.all([
      StoreModel.find(filter)
        .populate('ownerId', 'name email')
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .lean(),
      StoreModel.countDocuments(filter),
    ]);

    return {
      stores: stores.map((s: any) => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        address: s.address,
        category: s.category || 'Retail',
        city: s.city || 'General',
        coverImage: s.coverImage,
        isActive: s.isActive,
        averageRating: s.averageRating || 0,
        ratingCount: s.ratingCount || 0,
        createdAt: s.createdAt,
        owner: s.ownerId
          ? {
              id: s.ownerId._id?.toString(),
              name: s.ownerId.name,
              email: s.ownerId.email,
            }
          : null,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin Create Store
   */
  static async createStore(
    input: AdminCreateStoreInput,
    adminId: string,
    adminEmail: string
  ) {
    if (input.ownerId) {
      const owner = await UserModel.findOne({ _id: input.ownerId, role: 'STORE_OWNER' });
      if (!owner) {
        const error: any = new Error('Assigned owner not found or does not have STORE_OWNER role');
        error.statusCode = 400;
        throw error;
      }
    }

    const store = await StoreModel.create({
      name: input.name,
      email: input.email,
      address: input.address,
      category: input.category || 'Retail',
      city: input.city || 'General',
      ownerId: input.ownerId ? new mongoose.Types.ObjectId(input.ownerId) : undefined,
      isActive: true,
      averageRating: 0,
      ratingCount: 0,
    });

    await this.logAction(
      adminId,
      adminEmail,
      'ADMIN',
      'CREATE_STORE',
      'STORE',
      store._id.toString(),
      { storeName: store.name, ownerId: input.ownerId }
    );

    return {
      id: store._id.toString(),
      name: store.name,
      email: store.email,
      address: store.address,
      category: store.category,
      city: store.city,
      ownerId: store.ownerId?.toString() || null,
      isActive: store.isActive,
    };
  }

  /**
   * Admin Update Store
   */
  static async updateStore(
    storeId: string,
    input: AdminUpdateStoreInput,
    adminId: string,
    adminEmail: string
  ) {
    if (!mongoose.isValidObjectId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      const error: any = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }

    if (input.ownerId !== undefined) {
      if (input.ownerId !== null) {
        const owner = await UserModel.findOne({ _id: input.ownerId, role: 'STORE_OWNER' });
        if (!owner) {
          const error: any = new Error('Assigned owner not found or does not have STORE_OWNER role');
          error.statusCode = 400;
          throw error;
        }
        store.ownerId = new mongoose.Types.ObjectId(input.ownerId);
      } else {
        store.set('ownerId', undefined);
      }
    }

    if (input.name) store.name = input.name;
    if (input.email) store.email = input.email;
    if (input.address) store.address = input.address;
    if (input.category) store.category = input.category;
    if (input.city) store.city = input.city;
    if (input.isActive !== undefined) store.isActive = input.isActive;

    await store.save();

    await this.logAction(
      adminId,
      adminEmail,
      'ADMIN',
      'UPDATE_STORE',
      'STORE',
      storeId,
      { updatedFields: Object.keys(input) }
    );

    return {
      id: store._id.toString(),
      name: store.name,
      email: store.email,
      address: store.address,
      category: store.category,
      city: store.city,
      isActive: store.isActive,
      ownerId: store.ownerId?.toString() || null,
    };
  }

  /**
   * Assign Store to Owner
   */
  static async assignStoreOwner(
    storeId: string,
    ownerId: string | null,
    adminId: string,
    adminEmail: string
  ) {
    if (!mongoose.isValidObjectId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      const error: any = new Error('Store not found');
      error.statusCode = 404;
      throw error;
    }

    if (ownerId) {
      if (!mongoose.isValidObjectId(ownerId)) {
        throw new Error('Invalid owner ID');
      }
      const owner = await UserModel.findOne({ _id: ownerId, role: 'STORE_OWNER' });
      if (!owner) {
        const error: any = new Error('User not found or is not a STORE_OWNER');
        error.statusCode = 400;
        throw error;
      }
      store.ownerId = new mongoose.Types.ObjectId(ownerId);
    } else {
      store.set('ownerId', undefined);
    }

    await store.save();

    await this.logAction(
      adminId,
      adminEmail,
      'ADMIN',
      'ASSIGN_STORE_OWNER',
      'STORE',
      storeId,
      { assignedOwnerId: ownerId }
    );

    return {
      storeId,
      ownerId,
      message: ownerId ? 'Store assigned successfully' : 'Store owner unassigned',
    };
  }

  /**
   * Review Moderation: Get reports
   */
  static async getReports(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: any = {};

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      ReportModel.find(filter)
        .populate('reporterId', 'name email')
        .populate({
          path: 'ratingId',
          populate: [
            { path: 'userId', select: 'name email' },
            { path: 'storeId', select: 'name' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReportModel.countDocuments(filter),
    ]);

    const items = reports.map((r: any) => ({
      id: r._id.toString(),
      reason: r.reason,
      details: r.details,
      status: r.status,
      createdAt: r.createdAt,
      resolutionNotes: r.resolutionNotes,
      reporter: {
        id: r.reporterId?._id?.toString(),
        name: r.reporterId?.name,
        email: r.reporterId?.email,
      },
      review: r.ratingId
        ? {
            id: r.ratingId._id?.toString(),
            value: r.ratingId.value,
            comment: r.ratingId.comment,
            status: r.ratingId.status,
            authorName: r.ratingId.userId?.name || 'Anonymous',
            authorEmail: r.ratingId.userId?.email || '',
            storeName: r.ratingId.storeId?.name || 'Unknown Store',
            storeId: r.ratingId.storeId?._id?.toString(),
          }
        : null,
    }));

    return {
      reports: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Moderate Report and Review
   */
  static async moderateReport(
    reportId: string,
    action: 'HIDE_REVIEW' | 'DISMISS' | 'RESTORE_REVIEW',
    notes: string = '',
    adminId: string,
    adminEmail: string
  ) {
    if (!mongoose.isValidObjectId(reportId)) {
      throw new Error('Invalid report ID');
    }

    const report = await ReportModel.findById(reportId);
    if (!report) {
      const error: any = new Error('Report not found');
      error.statusCode = 404;
      throw error;
    }

    const rating = await RatingModel.findById(report.ratingId);
    if (!rating) {
      const error: any = new Error('Associated review not found');
      error.statusCode = 404;
      throw error;
    }

    const adminObjectId = new mongoose.Types.ObjectId(adminId);

    if (action === 'HIDE_REVIEW') {
      rating.status = 'HIDDEN';
      rating.moderatedAt = new Date();
      rating.moderatedBy = adminObjectId;
      rating.moderationReason = notes || 'Violates community guidelines';
      await rating.save();

      report.status = 'RESOLVED_HIDDEN';
      report.resolvedBy = adminObjectId;
      report.resolvedAt = new Date();
      report.resolutionNotes = notes;
      await report.save();
    } else if (action === 'RESTORE_REVIEW') {
      rating.status = 'VISIBLE';
      rating.moderatedAt = new Date();
      rating.moderatedBy = adminObjectId;
      rating.moderationReason = 'Restored by admin';
      await rating.save();

      report.status = 'RESOLVED_KEPT';
      report.resolvedBy = adminObjectId;
      report.resolvedAt = new Date();
      report.resolutionNotes = notes || 'Restored to visible';
      await report.save();
    } else if (action === 'DISMISS') {
      report.status = 'DISMISSED';
      report.resolvedBy = adminObjectId;
      report.resolvedAt = new Date();
      report.resolutionNotes = notes || 'Report dismissed as non-violating';
      await report.save();

      // Check if any other pending reports exist
      const pendingCount = await ReportModel.countDocuments({
        ratingId: rating._id,
        status: 'PENDING',
      });
      if (pendingCount === 0 && rating.status === 'FLAGGED') {
        rating.status = 'VISIBLE';
        await rating.save();
      }
    }

    // Recalculate store aggregates reliably after moderation
    const [stats] = await RatingModel.aggregate([
      { $match: { storeId: rating.storeId, status: 'VISIBLE' } },
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

    await StoreModel.updateOne(
      { _id: rating.storeId },
      { $set: { averageRating, ratingCount } }
    );

    await this.logAction(
      adminId,
      adminEmail,
      'ADMIN',
      `MODERATE_REPORT_${action}`,
      'REPORT',
      reportId,
      { ratingId: rating._id.toString(), storeId: rating.storeId.toString(), action, notes }
    );

    return {
      reportId,
      ratingId: rating._id.toString(),
      reportStatus: report.status,
      ratingStatus: rating.status,
      message: `Moderation action ${action} applied successfully`,
    };
  }

  /**
   * Administrative Audit Logs
   */
  static async getAuditLogs(query: {
    page?: number;
    limit?: number;
    action?: string;
    targetType?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: any = {};

    if (query.action) filter.action = query.action;
    if (query.targetType) filter.targetType = query.targetType;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments(filter),
    ]);

    return {
      auditLogs: logs.map((l: any) => ({
        id: l._id.toString(),
        actorId: l.actorId.toString(),
        actorEmail: l.actorEmail,
        actorRole: l.actorRole,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        metadata: l.metadata,
        createdAt: l.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
