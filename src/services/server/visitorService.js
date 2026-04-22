import dbConnect from '@/lib/mongodb';
import Visitor from '@/models/Visitor';
import VisitorRequest from '@/models/VisitorRequest';

export const visitorService = {
  async getVisitors({ hostelId, status, limit = 20, cursor }) {
    await dbConnect();
    
    let query = { hostelId };
    if (status) query.status = status;
    
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const visitors = await Visitor.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('studentId');
      
    const hasNextPage = visitors.length > limit;
    if (hasNextPage) visitors.pop();
    
    const nextCursor = hasNextPage ? visitors[visitors.length - 1]._id : null;
    
    return { visitors, nextCursor };
  },

  async createVisitor(data) {
    await dbConnect();
    return await Visitor.create(data);
  },

  async getVisitorById(id) {
    await dbConnect();
    return await Visitor.findById(id).populate('studentId');
  },

  async updateVisitor(id, data) {
    await dbConnect();
    const visitor = await Visitor.findById(id);
    if (!visitor) return null;
    Object.assign(visitor, data);
    return await visitor.save();
  },

  async checkOutVisitor(id) {
    await dbConnect();
    const visitor = await Visitor.findById(id);
    if (!visitor) return null;
    visitor.status = 'Checked-Out';
    visitor.checkOutTime = new Date();
    return await visitor.save();
  },

  async getAllVisitorRequests({ hostelId, studentId, status, limit = 20, cursor }) {
    await dbConnect();
    
    let query = { hostelId };
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;
    
    if (cursor) {
      query._id = { $lt: cursor };
    }
    
    const requests = await VisitorRequest.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('studentId');
      
    const hasNextPage = requests.length > limit;
    if (hasNextPage) requests.pop();
    
    const nextCursor = hasNextPage ? requests[requests.length - 1]._id : null;
    
    return { requests, nextCursor };
  },

  async createVisitorRequest(data) {
    await dbConnect();
    return await VisitorRequest.create(data);
  },

  async updateVisitorRequestStatus(id, status, adminNote) {
    await dbConnect();
    const request = await VisitorRequest.findById(id);
    if (!request) return null;
    request.status = status;
    request.adminNote = adminNote;
    request.updatedAt = new Date();
    return await request.save();
  }
};
