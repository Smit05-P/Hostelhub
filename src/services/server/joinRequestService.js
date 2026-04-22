import dbConnect from '@/lib/mongodb';
import JoinRequest from '@/models/JoinRequest';
import Hostel from '@/models/Hostel';
import Student from '@/models/Student';
import mongoose from 'mongoose';

export const joinRequestService = {
  async getJoinRequests({ hostelId, status, limit = 20, cursor }) {
    await dbConnect();
    
    let query = { hostelId };
    if (status) query.status = status;
    
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const requests = await JoinRequest.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1);
      
    const hasNextPage = requests.length > limit;
    if (hasNextPage) requests.pop();
    
    const nextCursor = hasNextPage ? requests[requests.length - 1]._id : null;
    
    return { requests, nextCursor };
  },

  async createRequest(data) {
    await dbConnect();
    
    // Check for existing pending request for this specific hostel
    const existing = await JoinRequest.findOne({
      userId: data.userId,
      hostelId: data.hostelId,
      status: 'Pending'
    });
    
    if (existing) {
      if (data.status === 'Approved') {
        // If we are auto-approving, just update the existing request
        existing.status = 'Approved';
        existing.handledAt = data.handledAt || new Date();
        existing.adminRemarks = data.adminRemarks || "Auto-approved by system.";
        if (data.duration) existing.duration = data.duration;
        if (data.joiningDate) existing.joiningDate = data.joiningDate;
        return await existing.save();
      }
      throw new Error("You already have a pending request for this hostel.");
    }
    
    return await JoinRequest.create(data);
  },

  /**
   * Robust student lookup that handles userId stored as string or ObjectId
   */
  async findStudentByRequest(request) {
    let student = null;

    // Try direct findById first (handles ObjectId correctly)
    try {
      student = await Student.findById(request.userId);
    } catch (_) {}

    // Fallback: try converting string userId to ObjectId
    if (!student && mongoose.Types.ObjectId.isValid(request.userId)) {
      try {
        student = await Student.findOne({ _id: new mongoose.Types.ObjectId(request.userId) });
      } catch (_) {}
    }

    // Last resort: find by email
    if (!student && request.userEmail) {
      student = await Student.findOne({ email: request.userEmail });
    }

    return student;
  },

  async handleRequest(id, status, remarks) {
    await dbConnect();
    
    const request = await JoinRequest.findById(id);
    if (!request) throw new Error("Request not found");
    
    if (request.status !== 'Pending') {
      throw new Error(`Request has already been ${request.status}`);
    }
    
    request.status = status;
    request.handledAt = new Date();
    request.adminRemarks = remarks;
    await request.save();
    
    // If approved, update student record immediately
    if (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() === 'Approved') {
      const student = await joinRequestService.findStudentByRequest(request);
      if (student) {
        student.hostelId = request.hostelId;
        student.hostelStatus = 'Approved';
        student.status = 'Active';
        
        // Transfer duration and joining date from the approved request
        if (request.duration) student.duration = request.duration;
        if (request.joiningDate) {
          student.joiningDate = request.joiningDate;
          student.arrivalDate = request.joiningDate; // Also set arrivalDate to trigger termEndDate calculation
        }
        
        await student.save();
        console.log(`[SERVICE] Updated student ${student.email} -> APPROVED, hostelId: ${request.hostelId}`);
      } else {
        console.warn(`[SERVICE] Could not find student record for userId: ${request.userId} — session self-healer will fix on next login.`);
      }
    } else if (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() === 'Rejected') {
      const student = await joinRequestService.findStudentByRequest(request);
      if (student) {
        student.hostelStatus = 'Rejected';
        student.hostelId = null;
        await student.save();
        console.log(`[SERVICE] Updated student ${student.email} -> REJECTED`);
      }
    }
    
    return request;
  }
};
