import mongoose from "mongoose";

const BetaAccessRequestSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    businessEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 24,
    },
    numberOfProperties: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

BetaAccessRequestSchema.index({ businessEmail: 1 }, { unique: true });

export default mongoose.models.BetaAccessRequest ||
  mongoose.model("BetaAccessRequest", BetaAccessRequestSchema);
