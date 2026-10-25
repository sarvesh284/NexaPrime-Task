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
  private static parseCloudinaryConfig(): { cloud_name: string; api_key: string; api_secret: string } | null {
    const cloudinaryUrl = env.CLOUDINARY_URL || process.env.CLOUDINARY_URL;
    if (cloudinaryUrl) {
      // Supports standard cloudinary://<api_key>:<api_secret>@<cloud_name>
      const match = cloudinaryUrl.trim().match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
      if (match) {
        return {
          api_key: match[1],
          api_secret: match[2],
          cloud_name: match[3],
        };
      }
    }

    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      return {
        cloud_name: env.CLOUDINARY_CLOUD_NAME.trim(),
        api_key: env.CLOUDINARY_API_KEY.trim(),
        api_secret: env.CLOUDINARY_API_SECRET.trim(),
      };
    }

    return null;
  }

  public static isCloudinaryConfigured(): boolean {
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    return this.parseCloudinaryConfig() !== null;
  }

  private static initCloudinary(): boolean {
    const config = this.parseCloudinaryConfig();
    if (config) {
      cloudinary.config({
        cloud_name: config.cloud_name,
        api_key: config.api_key,
        api_secret: config.api_secret,
        secure: true,
      });
      return true;
    }
    return false;
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
      console.log(`[StorageService] Uploading file to Cloudinary (${folder})...`);
      return new Promise<StoredFileResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `ratelocal/${folder}`,
            resource_type: 'image',
            format: mimeType.split('/')[1] || 'jpg',
          },
          (error, result: UploadApiResponse | undefined) => {
            if (error || !result) {
              console.error('[StorageService] Cloudinary upload error:', error);
              return reject(new Error(error?.message || 'Cloudinary upload failed'));
            }
            console.log(`[StorageService] Cloudinary upload succeeded: ${result.secure_url}`);
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

    // 2. Safe Local Storage Fallback (warn developer that cloud storage is not configured)
    console.warn(
      '[StorageService] Cloudinary credentials not configured in .env. Falling back to local disk storage. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET in backend/.env for cloud-hosted images.'
    );
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(originalName) || `.${mimeType.split('/')[1] || 'jpg'}`;
    const safeFilename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadsDir, safeFilename);

    await fs.promises.writeFile(filePath, fileBuffer);

    const backendHost = process.env.BACKEND_URL || `http://localhost:${env.PORT || 5000}`;
    const fileUrl = `${backendHost}/uploads/${folder}/${safeFilename}`;

    return {
      url: fileUrl,
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
