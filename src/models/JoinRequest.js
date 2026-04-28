import mongoose from 'mongoose';

const JoinRequestSchema = new mongoose.Schema({
  userId: {
    type: String, // Can be authId or ObjectId
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userEmail: String,
  userImage: String,
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  hostelName: String,
  method: {
    type: String,
    enum: ['code', 'search'],
    default: 'search',
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  duration: String,
  joiningDate: Date,
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  handledAt: {
    type: Date,
  },
  adminRemarks: String,
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Status Normalization (Runs before validation to prevent enum errors)
JoinRequestSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }
});

// Prevent duplicate pending requests for the same user and hostel
JoinRequestSchema.index({ userId: 1, hostelId: 1, status: 1 });

export default mongoose.models.JoinRequest || mongoose.model('JoinRequest', JoinRequestSchema);
