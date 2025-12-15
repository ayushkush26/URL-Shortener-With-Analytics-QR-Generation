import mongoose, { Schema, Document } from 'mongoose';

export interface IApiKey extends Document {
    userId: mongoose.Types.ObjectId;
    keyId: string;
    secretHash: string;
    scopes: string[];
    lastUsedAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    expiresAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        keyId: {
            type: String,
            required: [true, 'Key ID is required'],
            unique: true,
            trim: true,
        },
        secretHash: {
            type: String,
            required: [true, 'Secret hash is required'],
            select: false, // Never return secret in queries
        },
        scopes: {
            type: [String],
            default: ['read'],
            enum: ['read', 'write', 'delete', 'admin'],
        },
        lastUsedAt: {
            type: Date,
            default: null,
        },
        revokedAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient lookups
apiKeySchema.index({ userId: 1, keyId: 1 });
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);
