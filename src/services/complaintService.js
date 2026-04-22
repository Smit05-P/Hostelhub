/**
 * src/services/complaintService.js
 */

export const complaintService = {
  async getComplaints({ hostelId, studentId, status }) {
    const params = new URLSearchParams();
    if (hostelId) params.append("hostelId", hostelId);
    if (studentId) params.append("studentId", studentId);
    if (status) params.append("status", status);

    const response = await fetch(`/api/complaints?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch complaints");
    }
    return response.json();
  },

  async createComplaint(data) {
    const response = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit complaint");
    }
    return response.json();
  }
};
