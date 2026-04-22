import mongoose from 'mongoose';

const FeeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentName: String,
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  roomNumber: String,
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue', 'Partially-Paid'],
    default: 'Pending',
  },
  paidAt: {
    type: Date,
  },
  paymentMethod: String,
  isTotalStayFee: {
    type: Boolean,
    default: false,
  },
  adminRemarks: String,
}, { timestamps: true });

FeeSchema.index({ hostelId: 1, month: 1, year: 1, status: 1 });
FeeSchema.index({ studentId: 1, year: -1, month: -1 });
FeeSchema.index({ hostelId: 1, createdAt: -1 });

// Status Normalization (Runs before validation to prevent enum errors)
FeeSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status
      .replace(/_/g, '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  }
});

export default mongoose.models.Fee || mongoose.model('Fee', FeeSchema);
