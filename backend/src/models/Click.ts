import mongoose, { Document, Schema } from 'mongoose';

export interface IClick extends Document {
  shortUrlId: mongoose.Types.ObjectId;
  shortCode: string; // Denormalized for fast queries
  linkId?: string; // For bio link clicks
  timestamp: Date;
  ip: string; // Hashed for privacy
  geo: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
  };
  device: {
    type?: string; // mobile, desktop, tablet
    os?: string;
    browser?: string;
    userAgent?: string;
  };
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  isBot: boolean;
  createdAt: Date;
}

const ClickSchema = new Schema<IClick>(
  {
    shortUrlId: {
      type: Schema.Types.ObjectId,
      ref: 'ShortUrl',
      required: true,
      index: true,
    },
    shortCode: {
      type: String,
      required: true,
      index: true,
    },
    linkId: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
      required: true,
    },
    geo: {
      country: String,
      region: String,
      city: String,
      lat: Number,
      lon: Number,
    },
    device: {
      type: String,
      os: String,
      browser: String,
      userAgent: String,
    },
    referrer: String,
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics queries
ClickSchema.index({ shortUrlId: 1, timestamp: -1 });
ClickSchema.index({ shortCode: 1, timestamp: -1 });
ClickSchema.index({ 'geo.country': 1, timestamp: -1 });
ClickSchema.index({ timestamp: -1 }); // For time-series queries

export const Click = mongoose.model<IClick>('Click', ClickSchema);
