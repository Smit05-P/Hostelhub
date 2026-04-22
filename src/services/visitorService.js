/**
 * src/services/visitorService.js
 */
import axios from "axios";

export const visitorService = {
  async getVisitors({ hostelId, studentId }) {
    const params = {};
    if (hostelId) params.hostelId = hostelId;
    if (studentId) params.studentId = studentId;

    const response = await axios.get("/api/visitors", { params });
    return response.data;
  },

  async createVisitor(data) {
    const response = await axios.post("/api/visitors", data);
    return response.data;
  },

  async updateVisitor(id, data) {
    const response = await axios.put(`/api/visitors/${id}`, data);
    return response.data;
  },

  async updateStatus(id, status, extraData = {}) {
    const response = await axios.patch(`/api/visitors/${id}`, { status, ...extraData });
    return response.data;
  },

  async deleteVisitor(id) {
    const response = await axios.delete(`/api/visitors/${id}`);
    return response.data;
  }
};
