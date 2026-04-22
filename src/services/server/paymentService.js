import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import Student from '@/models/Student';

export const paymentService = {
  async getPayments({ hostelId, studentId, type, limit = 20, cursor }) {
    await dbConnect();
    
    let query = { hostelId };
    if (studentId) query.studentId = studentId;
    if (type) query.type = type;
    
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const payments = await Payment.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('studentId');
      
    const hasNextPage = payments.length > limit;
    if (hasNextPage) payments.pop();
    
    const nextCursor = hasNextPage ? payments[payments.length - 1]._id : null;
    
    return { payments, nextCursor };
  },

  async createPayment(data) {
    await dbConnect();
    const payment = await Payment.create(data);
    
    // Update student balance (if applicable)
    if (data.type === 'rent' || data.type === 'security') {
      await Student.findByIdAndUpdate(data.studentId, {
        $inc: { balance: -data.amount } // Assuming balance decreases when paying (or logic depends on business)
      });
    }
    
    return payment;
  },

  async getStats(hostelId) {
    await dbConnect();
    const stats = await Payment.aggregate([
      { $match: { hostelId: new mongoose.Types.ObjectId(hostelId), status: 'Paid' } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    return stats;
  }
};
