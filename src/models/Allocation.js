import mongoose from 'mongoose';

const AllocationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  allocatedAt: {
    type: Date,
    default: Date.now,
  },
  deallocatedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Ended'],
    default: 'Active',
  },
  adminId: {
    type: String, // Or ObjectId if using Admin model ref
  }
}, { timestamps: true });

// Status Normalization (Runs before validation to prevent enum errors)
AllocationSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }
});

export default mongoose.models.Allocation || mongoose.model('Allocation', AllocationSchema);
