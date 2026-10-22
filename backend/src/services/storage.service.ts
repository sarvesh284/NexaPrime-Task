import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';

export interface StoredFileResult {
  url: string;
  storageKey: string;
  storageProvider: 'local' | 'cloudinary';
}

export class StorageService {
  private static isCloudinaryConfigured(): boolean {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    );
  }

  private static initCloudinary(): void {
    if (this.isCloudinaryConfigured()) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

  /**
   * Save an uploaded file buffer to Cloudinary or safe local disk storage
   */
  static async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'stores'
  ): Promise<StoredFileResult> {
    // 1. Managed Cloud Storage (Cloudinary)
    if (this.isCloudinaryConfigured()) {
      this.initCloudinary();
      return new Promise<StoredFileResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `nexaprime/${folder}`,
            resource_type: 'image',
            format: mimeType.split('/')[1] || 'jpg',
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error || !result) {
              return reject(new Error(error?.message || 'Cloudinary upload failed'));
            }
            resolve({
              url: result.secure_url,
              storageKey: result.public_id,
              storageProvider: 'cloudinary',
            });
          }
        );
        uploadStream.end(fileBuffer);
      });
    }

    // 2. Safe Local Storage Fallback (Production-conscious fallback)
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(originalName) || `.${mimeType.split('/')[1] || 'jpg'}`;
    const safeFilename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);

    await fs.promises.writeFile(filePath, fileBuffer);

    const relativeUrl = `/uploads/${folder}/${safeFilename}`;

    return {
      url: relativeUrl,
      storageKey: `${folder}/${safeFilename}`,
      storageProvider: 'local',
    };
  }

  /**
   * Delete an asset from storage
   */
  static async deleteFile(storageKey: string, provider: 'local' | 'cloudinary'): Promise<void> {
    try {
      if (provider === 'cloudinary' && this.isCloudinaryConfigured()) {
        this.initCloudinary();
        await cloudinary.uploader.destroy(storageKey);
      } else {
        const filePath = path.join(process.cwd(), 'uploads', storageKey);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch (err) {
      console.error(`Failed to delete storage asset (${storageKey}):`, err);
    }
  }
}
