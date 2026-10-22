import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'REVIEW_REPLY'
  | 'NEW_RATING'
  | 'STATUS_CHANGE'
  | 'REPORT_RESOLVED'
  | 'SYSTEM';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['REVIEW_REPLY', 'NEW_RATING', 'STATUS_CHANGE', 'REPORT_RESOLVED', 'SYSTEM'],
      default: 'SYSTEM',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
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

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>('Notification', notificationSchema);
