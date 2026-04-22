import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Don't return password by default
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
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
AdminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
