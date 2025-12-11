import mongoose, { Document, Schema } from 'mongoose';

export interface ILink {
  title: string;
  url: string;
  position: number;
  visible: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IShortUrl extends Document {
  ownerId: mongoose.Types.ObjectId;
  shortCode: string;
  slug?: string;
  type: string;
  defaultRedirectUrl: string;
  settings: {
    password?: string;
    expiresAt?: Date;
    maxClicks?: number;
    allowBots?: boolean;
    customDomain?: string;
  };
  links: ILink[]; // Embedded links for bio pages
  clicksCount: number; // Cached count
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILink>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    position: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false }
);

const ShortUrlSchema = new Schema<IShortUrl>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but enforce uniqueness
      trim: true,
    },
    type: {
      type: String,
      default: 'redirect',
      enum: ['redirect', 'bio link'],
    },
    defaultRedirectUrl: {
      type: String,
      required: true,
    },
    settings: {
      password: { type: String, select: false },
      expiresAt: Date,
      maxClicks: Number,
      allowBots: { type: Boolean, default: true },
      customDomain: String,
    },
    links: [LinkSchema], // Embedded links array
    clicksCount: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ShortUrlSchema.index({ ownerId: 1, createdAt: -1 });
ShortUrlSchema.index({ shortCode: 1 });
ShortUrlSchema.index({ slug: 1 });
ShortUrlSchema.index({ 'settings.expiresAt': 1 });

export const ShortUrl = mongoose.model<IShortUrl>('ShortUrl', ShortUrlSchema);
