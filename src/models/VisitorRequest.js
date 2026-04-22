import mongoose from 'mongoose';

const VisitorRequestSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentName: String,
  roomNo: String,
  visitorName: {
    type: String,
    required: true,
  },
  visitorPhone: String,
  relation: String,
  visitDate: {
    type: Date,
    required: true,
  },
  visitTime: String,
  duration: String,
  purpose: {
    type: String,
    required: true,
  },
  notes: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  adminNote: String,
}, { timestamps: true });

// Status Normalization (Runs before validation to prevent enum errors)
VisitorRequestSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }
});

export default mongoose.models.VisitorRequest || mongoose.model('VisitorRequest', VisitorRequestSchema);
