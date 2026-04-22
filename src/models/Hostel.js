import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

const HostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the hostel name'],
    trim: true,
  },
  ownerId: {
    type: String,
    required: true,
    index: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: String,
  email: String,
  capacity: {
    type: Number,
    default: 0,
  },
  joinCode: {
    type: String,
    unique: true,
    index: true,
    default: () => nanoid(),
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  autoApprove: {
    type: Boolean,
    default: false,
  },
  settings: {
    rentDueDay: {
      type: Number,
      default: 5,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    feeConfig: {
      "6M": { type: Number, default: 30000 },
      "1Y": { type: Number, default: 55000 },
      "2Y": { type: Number, default: 100000 },
      "3Y": { type: Number, default: 145000 },
      "4Y": { type: Number, default: 185000 }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

HostelSchema.index({ ownerId: 1, status: 1 });
HostelSchema.index({ status: 1, createdAt: -1 });

// Status Normalization (Runs before validation to prevent enum errors)
HostelSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }
});

export default mongoose.models.Hostel || mongoose.model('Hostel', HostelSchema);
