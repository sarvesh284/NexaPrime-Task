import mongoose, { Document, Schema } from 'mongoose';

export type PhotoStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'REPORTED';
export type StorageProvider = 'local' | 'cloudinary';

export interface IPhotoReport {
  userId: mongoose.Types.ObjectId;
  reason: string;
  details?: string;
  createdAt: Date;
}

export interface IPhoto extends Document {
  storeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  url: string;
  storageKey: string;
  storageProvider: StorageProvider;
  caption?: string;
  isCover: boolean;
  isOfficial: boolean;
  status: PhotoStatus;
  reports: IPhotoReport[];
  createdAt: Date;
  updatedAt: Date;
}

const photoReportSchema = new Schema<IPhotoReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    details: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const photoSchema = new Schema<IPhoto>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 'cloudinary'],
      default: 'local',
    },
    caption: {
      type: String,
      maxlength: 200,
      trim: true,
      default: '',
    },
    isCover: {
      type: Boolean,
      default: false,
      index: true,
    },
    isOfficial: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'REJECTED', 'REPORTED'],
      default: 'APPROVED',
      index: true,
    },
    reports: [photoReportSchema],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

photoSchema.index({ storeId: 1, status: 1, createdAt: -1 });
photoSchema.index({ storeId: 1, isCover: -1 });

export const PhotoModel = mongoose.model<IPhoto>('Photo', photoSchema);
