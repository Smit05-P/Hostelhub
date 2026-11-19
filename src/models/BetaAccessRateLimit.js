import mongoose from "mongoose";

const BetaAccessRateLimitSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

BetaAccessRateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.BetaAccessRateLimit ||
  mongoose.model("BetaAccessRateLimit", BetaAccessRateLimitSchema);
