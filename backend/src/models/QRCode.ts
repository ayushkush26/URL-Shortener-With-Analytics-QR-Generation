import mongoose, { Document, Schema } from 'mongoose';

export interface IQRCode extends Document {
  shortUrlId: mongoose.Types.ObjectId;
  format: string;
  size: number;
  storageUrl: string;
  hash: string;
  generatedAt: Date;
}

const QRCodeSchema = new Schema<IQRCode>(
  {
    shortUrlId: {
      type: Schema.Types.ObjectId,
      ref: 'ShortUrl',
      required: true,
      index: true,
    },
    format: {
      type: String,
      default: 'png',
      enum: ['png', 'svg', 'pdf'],
    },
    size: {
      type: Number,
      default: 256,
    },
    storageUrl: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

QRCodeSchema.index({ shortUrlId: 1 });

export const QRCode = mongoose.model<IQRCode>('QRCode', QRCodeSchema);

