import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true,
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['rent', 'security', 'electricity', 'other'],
    default: 'rent',
  },
  method: {
    type: String,
    enum: ['cash', 'online', 'cheque', 'upi', 'other'],
    default: 'cash',
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed'],
    default: 'Paid',
  },
  month: String,
  date: {
    type: Date,
    default: Date.now,
  },
  transactionId: String,
  remarks: String,
}, { timestamps: true });

PaymentSchema.index({ hostelId: 1, status: 1, date: -1 });
PaymentSchema.index({ studentId: 1, date: -1 });

// Field Normalization (Runs before validation to prevent enum errors)
PaymentSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }
  if (this.method) {
    this.method = this.method.toLowerCase();
    // Map common variations to enum values
    if (this.method === 'card' || this.method === 'netbanking') this.method = 'online';
    if (this.method === 'transfer') this.method = 'online';
  }
});

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
