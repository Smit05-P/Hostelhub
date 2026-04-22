/**
 * src/services/allocationService.js
 */

export const allocationService = {
  async getAllocations({ hostelId, status = "active" }) {
    const params = new URLSearchParams({ status, hostelId: hostelId || "" });
    const response = await fetch(`/api/allocations?${params.toString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch allocations");
    }
    return response.json();
  },

  async allocate(data) {
    const response = await fetch("/api/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to allocate student");
    }
    return response.json();
  },

  async deallocate(data) {
    const response = await fetch("/api/allocations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to deallocate student");
    }
    return response.json();
  }
};
