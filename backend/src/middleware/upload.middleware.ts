import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { env } from '../config/env';
import { sendError } from '../utils/response';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validates actual image magic bytes against executable/spoofed extensions
 */
export function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
}

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

const maxSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;

export const photoUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: maxSizeBytes,
    files: env.MAX_FILES_PER_UPLOAD,
  },
  fileFilter,
}).array('photos', env.MAX_FILES_PER_UPLOAD);

/**
 * Validates buffer magic bytes and handles multer errors
 */
export const validateImageContent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    sendError(res, 'At least one photo must be selected for upload.', 400, 'NO_FILES');
    return;
  }

  if (files.length > env.MAX_FILES_PER_UPLOAD) {
    sendError(
      res,
      `Maximum ${env.MAX_FILES_PER_UPLOAD} photos allowed per upload.`,
      400,
      'TOO_MANY_FILES'
    );
    return;
  }

  for (const file of files) {
    if (!isValidImageMagicBytes(file.buffer)) {
      sendError(
        res,
        `File '${file.originalname}' has invalid image content or unsupported format.`,
        400,
        'INVALID_IMAGE_CONTENT'
      );
      return;
    }
  }

  next();
};
