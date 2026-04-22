import dbConnect from '@/lib/mongodb';
import Expense from '@/models/Expense';

export const expenseService = {
  async getExpenses(hostelId) {
    await dbConnect();
    return await Expense.find({ hostelId }).sort({ date: -1 });
  },

  async createExpense(data) {
    await dbConnect();
    return await Expense.create(data);
  },

  async updateExpense(id, data) {
    await dbConnect();
    return await Expense.findByIdAndUpdate(id, data, { new: true });
  },

  async deleteExpense(id) {
    await dbConnect();
    return await Expense.findByIdAndDelete(id);
  }
};
