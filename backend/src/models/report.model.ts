import mongoose, { Document, Schema } from 'mongoose';

export type ReportReason = 'INAPPROPRIATE' | 'SPAM' | 'OFFENSIVE' | 'SUSPICIOUS' | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED_HIDDEN' | 'RESOLVED_KEPT' | 'DISMISSED';

export interface IReport extends Document {
  ratingId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    ratingId: {
      type: Schema.Types.ObjectId,
      ref: 'Rating',
      required: true,
      index: true,
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: ['INAPPROPRIATE', 'SPAM', 'OFFENSIVE', 'SUSPICIOUS', 'OTHER'],
      required: true,
    },
    details: {
      type: String,
      maxlength: 500,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'RESOLVED_HIDDEN', 'RESOLVED_KEPT', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      maxlength: 500,
      trim: true,
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

// Prevent duplicate reports on the same rating by the same user
reportSchema.index({ ratingId: 1, reporterId: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

export const ReportModel = mongoose.model<IReport>('Report', reportSchema);
