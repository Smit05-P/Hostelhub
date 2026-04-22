import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide the student name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    select: false,
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  role: {
    type: String,
    default: 'student',
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    index: true,
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  phone: {
    type: String,
  },
  address: String,
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Former', 'Pending'],
    default: 'Active',
  },
  hostelStatus: {
    type: String,
    enum: ['Approved', 'Pending', 'No-Hostel', 'Rejected'],
    default: 'No-Hostel',
  },
  idProof: String,
  enrollmentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  arrivalDate: Date,
  duration: String,
  termEndDate: Date,
  rentAmount: {
    type: Number,
    default: 0,
  },
  daysLeft: Number,
  balance: {
    type: Number,
    default: 0,
  },
  // Profile fields set by the student
  profileImage: String,
  emergencyContact: String,
  guardianName: String,
  // Academic details
  collegeName: String,
  course: String,
  year: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

StudentSchema.index({ hostelId: 1, status: 1, createdAt: -1 });
StudentSchema.index({ hostelId: 1, roomId: 1 });
StudentSchema.index({ hostelId: 1, hostelStatus: 1 });

// Status Normalization (Runs before validation to prevent enum errors)
StudentSchema.pre('validate', async function() {
  const normalize = (val) => {
    if (!val) return val;
    return val
      .replace(/_/g, '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  };

  if (this.status) this.status = normalize(this.status);
  if (this.hostelStatus) this.hostelStatus = normalize(this.hostelStatus);
});

// Lifecycle & Security logic before saving
StudentSchema.pre('save', async function() {
  // Password Hashing
  if (this.isModified('passwordHash') && this.passwordHash) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }

  // Lifecycle Calculations
  if (this.isModified('arrivalDate') || this.isModified('duration')) {
    if (this.arrivalDate && this.duration) {
      const DURATION_MAP = { 
        "6M": 6, 
        "1Y": 12, "2Y": 24, "3Y": 36, "4Y": 48, "5Y": 60, "6Y": 72 
      };
      const months = DURATION_MAP[this.duration] || parseInt(this.duration) || 12;
      
      const end = new Date(this.arrivalDate);
      end.setMonth(end.getMonth() + months);
      this.termEndDate = end;

      const now = new Date();
      const diff = end - now;
      this.daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
  }
});

// Match password method
StudentSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
