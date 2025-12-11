import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsDaily extends Document {
  shortUrlId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  totalClicks: number;
  uniqueClicks: number;
  topCountries: Array<{ country: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
  clicksByHour: Array<{ hour: number; count: number }>;
}

const AnalyticsDailySchema = new Schema<IAnalyticsDaily>(
  {
    shortUrlId: {
      type: Schema.Types.ObjectId,
      ref: 'ShortUrl',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    uniqueClicks: {
      type: Number,
      default: 0,
    },
    topCountries: [
      {
        country: String,
        count: Number,
      },
    ],
    topBrowsers: [
      {
        browser: String,
        count: Number,
      },
    ],
    topDevices: [
      {
        device: String,
        count: Number,
      },
    ],
    clicksByHour: [
      {
        hour: Number,
        count: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index
AnalyticsDailySchema.index({ shortUrlId: 1, date: 1 }, { unique: true });
AnalyticsDailySchema.index({ date: -1 });

export const AnalyticsDaily = mongoose.model<IAnalyticsDaily>('AnalyticsDaily', AnalyticsDailySchema);

