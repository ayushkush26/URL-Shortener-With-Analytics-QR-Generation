import mongoose from "mongoose";

const clickSchema = new mongoose.Schema(
  {
    shortUrlId: { type: mongoose.Schema.Types.ObjectId, ref: "ShortUrl", required: true },
    shortCode: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String }
  },
  { timestamps: true }
);

clickSchema.index({ shortUrlId: 1, createdAt: -1 });

export const Click = mongoose.model("Click", clickSchema);
