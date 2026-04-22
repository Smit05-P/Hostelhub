/**
 * src/services/studentService.js
 * 
 * Centralized service for interacting with the /api/students endpoints.
 * Decouples components and hooks from direct fetch() calls and URL construction.
 */

export const studentService = {
  /**
   * Fetches a paginated list of students.
   * @param {Object} params - Filter and pagination params
   * @param {string} params.hostelId - Required hostel context
   * @param {string} params.search - Optional search string
   * @param {string} params.room_id - Optional room filter ('all', 'none', or specific ID)
   * @param {string} params.status - Optional status filter ('all', 'Active', 'Inactive')
   * @param {number} params.pageSize - Number of items per page
   * @param {string} params.cursor - The ID of the last document from previous page
   */
  async getStudents({ 
    hostelId, 
    search = "", 
    room_id = "all", 
    status = "all", 
    pageSize = 10, 
    cursor = null 
  }) {
    const query = new URLSearchParams({
      pageSize: pageSize.toString(),
      room_id,
      status,
    });
    
    if (search) query.append("search", search);
    if (cursor) query.append("cursor", cursor);
    if (hostelId) query.append("hostelId", hostelId);

    const response = await fetch(`/api/students?${query.toString()}`, {
      headers: {
        "x-hostel-id": hostelId || "",
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch student data");
    }

    return response.json();
  },

  /**
   * Registers a new student.
   * @param {Object} data - Student data
   * @param {string} hostelId - Hostel context
   */
  async createStudent(data, hostelId) {
    const response = await fetch("/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hostel-id": hostelId || "",
      },
      body: JSON.stringify({ ...data, hostelId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to register student");
    }

    return response.json();
  }
};
