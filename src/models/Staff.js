import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
  },
  phone: String,
  salary: Number,
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
}, { timestamps: true });

// Status Normalization (Runs before validation to prevent enum errors)
StaffSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status
      .replace(/_/g, '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  }
});

export default mongoose.models.Staff || mongoose.model('Staff', StaffSchema);
