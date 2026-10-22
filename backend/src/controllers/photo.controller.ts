import { Request, Response, NextFunction } from 'express';
import { PhotoService } from '../services/photo.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class PhotoController {
  static async uploadPhotos(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      const rawCaptions = req.body?.captions ?? req.body?.caption ?? [];
      const captions = Array.isArray(rawCaptions)
        ? rawCaptions
        : typeof rawCaptions === 'string'
        ? [rawCaptions]
        : [];

      const photos = await PhotoService.uploadPhotos(
        req.user!.userId,
        req.user!.role,
        req.params.storeId,
        files,
        captions
      );

      sendSuccess(res, { photos }, 'Photos uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getStorePhotos(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await PhotoService.getStorePhotos(req.params.storeId, page, limit);
      sendSuccess(res, result.photos, 'Store photos retrieved', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getMyPhotos(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await PhotoService.getMyPhotos(req.user!.userId, page, limit);
      sendSuccess(res, result.photos, 'User photos retrieved', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async deletePhoto(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await PhotoService.deletePhoto(
        req.user!.userId,
        req.user!.role,
        req.params.id
      );
      sendSuccess(res, null, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async setCoverPhoto(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await PhotoService.setCoverPhoto(
        req.user!.userId,
        req.user!.role,
        req.params.storeId,
        req.params.photoId
      );
      sendSuccess(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async reportPhoto(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { reason, details } = req.body;
      const result = await PhotoService.reportPhoto(
        req.user!.userId,
        req.params.id,
        reason || 'INAPPROPRIATE',
        details
      );
      sendSuccess(res, null, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getReportedPhotos(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = _req.query.page ? parseInt(_req.query.page as string, 10) : 1;
      const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : 10;

      const result = await PhotoService.getReportedPhotos(page, limit);
      sendSuccess(res, result.photos, 'Reported photos retrieved', 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async moderatePhoto(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { action, reason } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await PhotoService.moderatePhoto(
        req.user!.userId,
        req.params.id,
        action,
        reason,
        ip,
        userAgent
      );
      sendSuccess(res, null, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}
