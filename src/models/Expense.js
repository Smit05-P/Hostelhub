import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['utilities', 'maintenance', 'food', 'salary', 'rent', 'other'],
    default: 'other',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  remarks: String,
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
