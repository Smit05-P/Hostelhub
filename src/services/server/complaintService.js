import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Complaint from '@/models/Complaint';

export const complaintService = {
  async getComplaints({ hostelId, studentId, status, priority, limit = 20, cursor }) {
    await dbConnect();

    // Ensure hostelId is a valid ObjectId
    if (hostelId && !mongoose.Types.ObjectId.isValid(hostelId)) {
      throw new Error("Invalid hostelId provided");
    }

    let query = { hostelId: new mongoose.Types.ObjectId(hostelId) };
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const complaints = await Complaint.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('studentId', 'name email roomId')
      .lean();

    const hasNextPage = complaints.length > limit;
    if (hasNextPage) complaints.pop();

    const nextCursor = hasNextPage ? complaints[complaints.length - 1]._id : null;

    // Normalize for frontend (remarks -> response)
    const normalizedComplaints = complaints.map(c => ({
      ...c,
      response: c.remarks || null,
      id: c._id.toString()
    }));

    return { complaints: normalizedComplaints, nextCursor };
  },

  async createComplaint(data) {
    await dbConnect();
    // Ensure IDs are ObjectIds
    if (data.hostelId) data.hostelId = new mongoose.Types.ObjectId(data.hostelId);
    if (data.studentId && mongoose.Types.ObjectId.isValid(data.studentId)) {
       data.studentId = new mongoose.Types.ObjectId(data.studentId);
    }
    
    return await Complaint.create(data);
  },

  async getComplaintById(id) {
    await dbConnect();
    const complaint = await Complaint.findById(id)
      .populate('studentId', 'name email roomId')
      .lean();
    
    if (complaint) {
      complaint.response = complaint.remarks || null;
      complaint.id = complaint._id.toString();
    }
    
    return complaint;
  },

  async updateComplaint(id, data) {
    await dbConnect();
    const complaint = await Complaint.findById(id);
    if (!complaint) return null;

    // Normalize incoming status if present for internal logic
    if (data.status) {
      const normalizedStatus = data.status.charAt(0).toUpperCase() + data.status.slice(1).toLowerCase();
      if (normalizedStatus === 'Resolved' || normalizedStatus === 'Closed') {
        data.resolvedAt = new Date();
      }
    }

    // Map 'response' from frontend to 'remarks' in backend if present
    if (data.response) {
      data.remarks = data.response;
    }

    Object.assign(complaint, data);
    return await complaint.save();
  },

  async deleteComplaint(id) {
    await dbConnect();
    return await Complaint.findByIdAndDelete(id);
  }
};
