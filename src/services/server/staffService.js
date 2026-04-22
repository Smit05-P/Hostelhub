import dbConnect from '@/lib/mongodb';
import Staff from '@/models/Staff';

export const staffService = {
  async getStaff(hostelId) {
    await dbConnect();
    return await Staff.find({ hostelId });
  },

  async createStaff(data) {
    await dbConnect();
    return await Staff.create(data);
  },

  async updateStaff(id, data) {
    await dbConnect();
    const staff = await Staff.findById(id);
    if (!staff) return null;
    Object.assign(staff, data);
    return await staff.save();
  },

  async deleteStaff(id) {
    await dbConnect();
    return await Staff.findByIdAndDelete(id);
  }
};
