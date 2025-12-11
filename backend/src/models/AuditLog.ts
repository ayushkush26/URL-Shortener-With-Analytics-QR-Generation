import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  userId?: mongoose.Types.ObjectId;
  targetCollection: string;
  targetId?: mongoose.Types.ObjectId;
  meta: {
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'update',
        'delete',
        'login',
        'logout',
        'register',
        'api_key_create',
        'api_key_revoke',
        'password_change',
        '2fa_enable',
        '2fa_disable',
      ],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetCollection: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use timestamp field instead
  }
);

// Compound indexes for efficient queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ targetCollection: 1, targetId: 1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

