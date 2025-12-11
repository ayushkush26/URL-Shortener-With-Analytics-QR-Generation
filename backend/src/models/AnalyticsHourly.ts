import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsHourly extends Document {
  shortUrlId: mongoose.Types.ObjectId;
  hour: string; // YYYY-MM-DDTHH format
  totalClicks: number;
}

const AnalyticsHourlySchema = new Schema<IAnalyticsHourly>(
  {
    shortUrlId: {
      type: Schema.Types.ObjectId,
      ref: 'ShortUrl',
      required: true,
      index: true,
    },
    hour: {
      type: String,
      required: true,
      index: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index
AnalyticsHourlySchema.index({ shortUrlId: 1, hour: 1 }, { unique: true });
AnalyticsHourlySchema.index({ hour: -1 });

export const AnalyticsHourly = mongoose.model<IAnalyticsHourly>('AnalyticsHourly', AnalyticsHourlySchema);

