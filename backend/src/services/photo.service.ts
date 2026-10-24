import mongoose from 'mongoose';
import { PhotoModel, IPhoto } from '../models/photo.model';
import { StoreModel } from '../models/store.model';
import { UserModel } from '../models/user.model';
import { AuditLogModel } from '../models/auditLog.model';
import { StorageService } from './storage.service';

export class PhotoService {
  /**
   * Upload multiple photos for a store
   */
  static async uploadPhotos(
    userId: string,
    userRole: string,
    storeId: string,
    files: Express.Multer.File[],
    captions: string[] = []
  ): Promise<IPhoto[]> {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      const err: any = new Error('Invalid store ID format');
      err.statusCode = 400;
      err.code = 'INVALID_STORE_ID';
      throw err;
    }

    const store = await StoreModel.findById(storeId);
    if (!store || !store.isActive) {
      const err: any = new Error('Store not found or inactive');
      err.statusCode = 404;
      err.code = 'STORE_NOT_FOUND';
      throw err;
    }

    const isStoreOwner = Boolean(
      store.ownerId && store.ownerId.toString() === userId.toString()
    );
    const isOfficial = isStoreOwner;

    const savedPhotos: IPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = captions[i] ? captions[i].slice(0, 200).trim() : '';

      // Upload file buffer safely
      const storageResult = await StorageService.saveFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'stores'
      );

      // Determine initial cover image status
      // If store currently has no cover image, first uploaded official photo becomes cover
      let isCover = false;
      if (!store.coverImage && (isOfficial || savedPhotos.length === 0)) {
        isCover = true;
        store.coverImage = storageResult.url;
      }

      const photo = new PhotoModel({
        storeId: store._id,
        userId: new mongoose.Types.ObjectId(userId),
        url: storageResult.url,
        storageKey: storageResult.storageKey,
        storageProvider: storageResult.storageProvider,
        caption,
        isCover,
        isOfficial,
        status: 'APPROVED',
      });

      await photo.save();
      savedPhotos.push(photo);
    }

    if (store.isModified('coverImage')) {
      await store.save();
    }

    return savedPhotos;
  }

  /**
   * Retrieve approved photos for a store
   */
  static async getStorePhotos(storeId: string, page: number = 1, limit: number = 20) {
    if (!mongoose.Types.ObjectId.isValid(storeId)) {
      const err: any = new Error('Invalid store ID format');
      err.statusCode = 400;
      err.code = 'INVALID_STORE_ID';
      throw err;
    }

    const filter = {
      storeId: new mongoose.Types.ObjectId(storeId),
      status: 'APPROVED',
    };

    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      PhotoModel.find(filter)
        .sort({ isCover: -1, isOfficial: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email role')
        .lean(),
      PhotoModel.countDocuments(filter),
    ]);

    return {
      photos: photos.map((p: any) => ({
        ...p,
        id: p._id.toString(),
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
   * Retrieve authenticated user's uploaded photos
   */
  static async getMyPhotos(userId: string, page: number = 1, limit: number = 20) {
    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      PhotoModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('storeId', 'name address category city coverImage')
        .lean(),
      PhotoModel.countDocuments(filter),
    ]);

    return {
      photos: photos.map((p: any) => ({
        ...p,
        id: p._id.toString(),
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
   * Delete an authorized photo
   * Allowed for: uploader or store owner of that store
   */
  static async deletePhoto(userId: string, userRole: string, photoId: string) {
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      const err: any = new Error('Invalid photo ID format');
      err.statusCode = 400;
      err.code = 'INVALID_PHOTO_ID';
      throw err;
    }

    const photo = await PhotoModel.findById(photoId);
    if (!photo) {
      const err: any = new Error('Photo not found');
      err.statusCode = 404;
      err.code = 'PHOTO_NOT_FOUND';
      throw err;
    }

    const store = await StoreModel.findById(photo.storeId);
    const isUploader = photo.userId.toString() === userId.toString();
    const isStoreOwner = Boolean(
      store && store.ownerId && store.ownerId.toString() === userId.toString()
    );

    if (!isUploader && !isStoreOwner) {
      const err: any = new Error('You are not authorized to delete this photo');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // Clean up file in storage provider
    await StorageService.deleteFile(photo.storageKey, photo.storageProvider);

    // If deleted photo was store's cover photo, reassign or clear
    if (photo.isCover && store) {
      const nextPhoto = await PhotoModel.findOne({
        storeId: store._id,
        _id: { $ne: photo._id },
        status: 'APPROVED',
      }).sort({ isOfficial: -1, createdAt: -1 });

      if (nextPhoto) {
        nextPhoto.isCover = true;
        await nextPhoto.save();
        store.coverImage = nextPhoto.url;
      } else {
        store.coverImage = '';
      }
      await store.save();
    }

    await PhotoModel.deleteOne({ _id: photo._id });

    return {
      message: 'Photo deleted successfully.',
    };
  }

  /**
   * Set or change store cover photo
   * Allowed for: verified store owner of this store
   */
  static async setCoverPhoto(
    userId: string,
    userRole: string,
    storeId: string,
    photoId: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(storeId) || !mongoose.Types.ObjectId.isValid(photoId)) {
      const err: any = new Error('Invalid store or photo ID format');
      err.statusCode = 400;
      err.code = 'INVALID_ID_FORMAT';
      throw err;
    }

    const store = await StoreModel.findById(storeId);
    if (!store || !store.isActive) {
      const err: any = new Error('Store not found or inactive');
      err.statusCode = 404;
      err.code = 'STORE_NOT_FOUND';
      throw err;
    }

    const isStoreOwner = Boolean(
      store.ownerId && store.ownerId.toString() === userId.toString()
    );

    if (!isStoreOwner) {
      const err: any = new Error(
        'Only the verified store owner can select the cover photo'
      );
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const photo = await PhotoModel.findOne({
      _id: photoId,
      storeId: store._id,
      status: 'APPROVED',
    });

    if (!photo) {
      const err: any = new Error('Photo not found or not approved for this store');
      err.statusCode = 404;
      err.code = 'PHOTO_NOT_FOUND';
      throw err;
    }

    // Unset current cover photo for this store
    await PhotoModel.updateMany({ storeId: store._id }, { $set: { isCover: false } });

    // Set target photo as cover atomically
    await PhotoModel.updateOne({ _id: photo._id }, { $set: { isCover: true } });
    photo.isCover = true;

    // Update store coverImage
    store.coverImage = photo.url;
    await store.save();

    return {
      message: 'Store cover photo updated successfully.',
      coverImage: photo.url,
      photoId: photo._id.toString(),
    };
  }

  /**
   * Report an inappropriate photo
   */
  static async reportPhoto(
    userId: string,
    photoId: string,
    reason: string,
    details?: string
  ) {
    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      const err: any = new Error('Invalid photo ID format');
      err.statusCode = 400;
      err.code = 'INVALID_PHOTO_ID';
      throw err;
    }

    const photo = await PhotoModel.findById(photoId);
    if (!photo) {
      const err: any = new Error('Photo not found');
      err.statusCode = 404;
      err.code = 'PHOTO_NOT_FOUND';
      throw err;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const alreadyReported = photo.reports.some(
      (r) => r.userId.toString() === userId.toString()
    );

    if (alreadyReported) {
      const err: any = new Error('You have already reported this photo');
      err.statusCode = 409;
      err.code = 'DUPLICATE_REPORT';
      throw err;
    }

    photo.reports.push({
      userId: userObjectId,
      reason,
      details: details ? details.slice(0, 500).trim() : '',
      createdAt: new Date(),
    });

    photo.status = 'REPORTED';
    await photo.save();

    return {
      message: 'Photo report submitted. Our team will review this photo.',
    };
  }
}
