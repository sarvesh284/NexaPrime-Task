import mongoose, { Document, Schema } from 'mongoose';

export type RatingStatus = 'VISIBLE' | 'HIDDEN' | 'FLAGGED';

export interface IOwnerReply {
  text: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: mongoose.Types.ObjectId;
}

export interface IRating extends Document {
  userId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  value: number;
  comment?: string;
  status: RatingStatus;
  moderatedAt?: Date;
  moderatedBy?: mongoose.Types.ObjectId;
  moderationReason?: string;
  helpfulVotes: mongoose.Types.ObjectId[];
  helpfulCount: number;
  ownerReply?: IOwnerReply;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    value: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer rating',
      },
    },
    comment: {
      type: String,
      maxlength: 500,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['VISIBLE', 'HIDDEN', 'FLAGGED'],
      default: 'VISIBLE',
      index: true,
    },
    moderatedAt: {
      type: Date,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderationReason: {
      type: String,
    },
    helpfulVotes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    helpfulCount: {
      type: Number,
      default: 0,
      index: true,
    },
    ownerReply: {
      type: new Schema<IOwnerReply>(
        {
          text: {
            type: String,
            maxlength: 1000,
            trim: true,
          },
          createdAt: {
            type: Date,
          },
          updatedAt: {
            type: Date,
          },
          ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        },
        { _id: false }
      ),
      default: undefined,
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

// Unique compound index: One rating per user per store
ratingSchema.index({ userId: 1, storeId: 1 }, { unique: true });

// Compound indexes for aggregations and public review display
ratingSchema.index({ storeId: 1, status: 1, createdAt: -1 });
ratingSchema.index({ storeId: 1, status: 1, helpfulCount: -1 });

export const RatingModel = mongoose.model<IRating>('Rating', ratingSchema);
