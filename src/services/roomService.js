/**
 * src/services/roomService.js
 * 
 * Centralized service for interacting with room-related APIs.
 */

export const roomService = {
  async getRooms(hostelId) {
    const response = await fetch(`/api/rooms?hostelId=${hostelId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch rooms");
    }
    return response.json();
  },

  async getRoomById(id) {
    const response = await fetch(`/api/rooms/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch room details");
    }
    return response.json();
  },

  async createRoom(data, hostelId) {
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, hostelId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create room");
    }
    return response.json();
  },

  async updateRoom(id, data) {
    const response = await fetch(`/api/rooms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update room");
    }
    return response.json();
  },

  async deleteRoom(id) {
    const response = await fetch(`/api/rooms/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete room");
    }
    return response.json();
  }
};
