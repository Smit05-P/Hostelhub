import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentName: String,
  roomNumber: String,
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'Maintenance',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'low',
  },
  status: {
    type: String,
    enum: ['Pending', 'In-Progress', 'Resolved', 'Closed'],
    default: 'Pending',
  },
  resolvedAt: Date,
  remarks: String,
}, { timestamps: true });

ComplaintSchema.index({ hostelId: 1, status: 1, createdAt: -1 });
ComplaintSchema.index({ studentId: 1, createdAt: -1 });

// Status Normalization (Runs before validation to prevent enum errors)
ComplaintSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status
      .replace(/_/g, '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  }
});

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
