import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreCoordinates {
  lat: number;
  lng: number;
}

export interface IStore extends Document {
  name: string;
  email?: string;
  address: string;
  category: string;
  city: string;
  state?: string;
  description?: string;
  phone?: string;
  website?: string;
  coordinates?: IStoreCoordinates;
  coverImage?: string;
  ownerId?: mongoose.Types.ObjectId;
  isActive: boolean;
  isDemo?: boolean;
  averageRating?: number;
  ratingCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      required: true,
      maxlength: 400,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Retail',
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
      default: 'General',
      trim: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      maxlength: 30,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      maxlength: 200,
      trim: true,
      default: '',
    },
    coordinates: {
      lat: { type: Number, required: false },
      lng: { type: Number, required: false },
    },
    state: {
      type: String,
      default: 'Maharashtra',
      trim: true,
      index: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
      index: true,
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
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

// Compound indexes
storeSchema.index({ isActive: 1, name: 1 });
storeSchema.index({ isActive: 1, category: 1 });
storeSchema.index({ isActive: 1, city: 1 });

export const StoreModel = mongoose.model<IStore>('Store', storeSchema);
