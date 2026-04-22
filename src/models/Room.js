import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
  },
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['single', 'double', 'triple', 'four', 'other'],
    default: 'double',
  },
  capacity: {
    type: Number,
    required: true,
  },
  floor: String,
  rent: {
    type: Number,
    required: true,
  },
  amenities: [String],
  occupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  status: {
    type: String,
    enum: ['Available', 'Full', 'Maintenance'],
    default: 'Available',
  },
}, { timestamps: true });

RoomSchema.index({ hostelId: 1, status: 1 });
RoomSchema.index({ hostelId: 1, roomNumber: 1 }, { unique: true });

// Status Normalization (Runs before validation to prevent enum errors)
RoomSchema.pre('validate', async function() {
  if (this.status) {
    this.status = this.status
      .replace(/_/g, '-')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('-');
  }
});

export default mongoose.models.Room || mongoose.model('Room', RoomSchema);
