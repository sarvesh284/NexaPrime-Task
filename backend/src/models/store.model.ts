import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  name: string;
  address: string;
  ownerId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 60,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      maxlength: 400,
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Compound index for active store search
storeSchema.index({ isActive: 1, name: 1 });

export const StoreModel = mongoose.model<IStore>('Store', storeSchema);
