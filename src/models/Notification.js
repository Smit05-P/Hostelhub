import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  recipientId: {
    type: String, // Can be studentId, adminId, 'all_students', etc.
    required: true,
  },
  recipientRole: {
    type: String,
    enum: ['admin', 'student', 'staff'],
    required: true,
  },
  senderId: {
    type: String,
    default: 'system',
  },
  senderRole: {
    type: String,
    default: 'system',
  },
  senderName: {
    type: String,
    default: 'System',
  },
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  actionUrl: String,
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for efficient querying
NotificationSchema.index({ hostelId: 1, recipientId: 1, recipientRole: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
