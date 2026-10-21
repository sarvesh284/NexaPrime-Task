import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  name: string;
  email?: string;
  address: string;
  category: string;
  city: string;
  ownerId?: mongoose.Types.ObjectId;
  isActive: boolean;
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
