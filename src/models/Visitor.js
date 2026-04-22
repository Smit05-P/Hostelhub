import mongoose from 'mongoose';

const VisitorSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false,
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
  expectedDuration: {
    type: Number, // in minutes
    default: 60,
  },
  purpose: {
    type: String,
    required: true,
  },
  notes: String,
  visitorImage: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Checked-In', 'Completed'],
    default: 'Pending',
  },
  checkInTime: Date,
  checkOutTime: Date,
  adminNote: String,
}, { timestamps: true });

// Status Normalization
VisitorSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  }
});

export default mongoose.models.Visitor || mongoose.model('Visitor', VisitorSchema);
