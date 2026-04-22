/**
 * src/services/hostelService.js
 * 
 * Centralized service for interacting with hostel-related APIs.
 */

export const hostelService = {
  async getHostelById(id) {
    const response = await fetch(`/api/hostels/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch hostel details");
    }
    return response.json();
  },

  async getHostelsByOwner(ownerId) {
    const response = await fetch(`/api/hostels?ownerId=${ownerId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch hostels");
    }
    return response.json();
  },

  async createHostel(data) {
    const response = await fetch("/api/hostels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create hostel");
    }
    return response.json();
  },

  async updateHostel(id, data) {
    const response = await fetch(`/api/hostels?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update hostel");
    }
    return response.json();
  },

  async deleteHostel(id) {
    const response = await fetch(`/api/hostels?id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete hostel");
    }
    return response.json();
  }
};
