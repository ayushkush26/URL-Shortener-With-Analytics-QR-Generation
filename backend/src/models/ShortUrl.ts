import mongoose, { Document, Schema } from 'mongoose';

export interface IShortUrl extends Document {
  originalUrl: string;
  shortCode: string;
  clicksCount: number;
  createdAt: Date;
}

const ShortUrlSchema = new Schema<IShortUrl>(
  {
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true },
    clicksCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

ShortUrlSchema.index({ shortCode: 1 });
export const ShortUrl = mongoose.model<IShortUrl>('ShortUrl', ShortUrlSchema);
