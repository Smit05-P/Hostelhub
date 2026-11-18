import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide admin name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    select: false, // Don't return password by default
  },
  googleId: {
    type: String,
    sparse: true,
    index: true,
  },
  authProvider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active',
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin'],
    default: 'admin',
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profileImage: String,
  lastLogin: Date,
}, { timestamps: true });

// Hash password before saving
AdminSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  // Prevent double-hashing if password is already a bcrypt hash
  if (typeof this.password === 'string' && this.password.startsWith('$2')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Safe password comparison
AdminSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password || !enteredPassword) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
