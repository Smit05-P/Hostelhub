/**
 * src/services/noticeService.js
 */

export const noticeService = {
  async getNotices(hostelId) {
    const params = new URLSearchParams({ hostelId: hostelId || "" });
    const response = await fetch(`/api/notices?${params.toString()}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch notices");
    }
    return response.json();
  },

  async createNotice(data) {
    const response = await fetch("/api/notices", {
      method: "POST",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create notice");
    }
    return response.json();
  }
};

