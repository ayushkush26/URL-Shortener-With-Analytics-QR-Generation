import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  username: string;
  roles: string[];
  twoFA?: {
    secret: string;
    enabled: boolean;
    backupCodes: string[];
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    jobTitle?: string;
    company?: string;
    location?: string;
    isPublic?: boolean;
  };
  linkhubLinks?: Array<{
    title: string;
    url: string;
    position: number;
    visible: boolean;
    icon?: string;
  }>;
  plan?: {
    name: string;
    limits: {
      shortUrls: number;
      clicksPerMonth: number;
      customDomains: number;
    };
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be less than 30 characters'],
      match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, hyphens, and underscores'],
    },
    roles: {
      type: [String],
      default: ['user'],
      enum: ['user', 'admin', 'premium'],
    },
    twoFA: {
      secret: { type: String, select: false },
      enabled: { type: Boolean, default: false },
      backupCodes: [{ type: String, select: false }],
    },
    profile: {
      firstName: String,
      lastName: String,
      avatar: String,
      bio: String,
      phone: String,
      jobTitle: String,
      company: String,
      location: String,
      isPublic: { type: Boolean, default: true },
    },
    linkhubLinks: [{
      title: { type: String, required: true },
      url: { type: String, required: true },
      position: { type: Number, default: 0 },
      visible: { type: Boolean, default: true },
      icon: String,
    }],
    plan: {
      name: { type: String, default: 'free', enum: ['free', 'pro', 'enterprise'] },
      limits: {
        shortUrls: { type: Number, default: 100 },
        clicksPerMonth: { type: Number, default: 10000 },
        customDomains: { type: Number, default: 0 },
      },
      expiresAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ 'plan.name': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

