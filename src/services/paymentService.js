/**
 * src/services/paymentService.js
 * 
 * Centralized service for interacting with payment and fee APIs.
 */

export const paymentService = {
  /**
   * Fetches payments with optional filtering.
   */
  async getPayments({ studentId, hostelId }) {
    const params = new URLSearchParams();
    if (studentId) params.append("studentId", studentId);
    if (hostelId) params.append("hostelId", hostelId);

    const response = await fetch(`/api/payments?${params.toString()}`, {
      headers: { "x-hostel-id": hostelId || "" }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch payments");
    }

    return response.json();
  },

  /**
   * Records a new payment.
   */
  async recordPayment(data, hostelId) {
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hostel-id": hostelId || "",
      },
      body: JSON.stringify({ ...data, hostelId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to record payment");
    }

    return response.json();
  },

  /**
   * Fetches fees with filters.
   */
  async getFees({ studentId, month, year, status, hostelId }) {
    const params = new URLSearchParams();
    if (studentId) params.append("studentId", studentId);
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (status) params.append("status", status);
    if (hostelId) params.append("hostelId", hostelId);

    const response = await fetch(`/api/fees?${params.toString()}`, {
      headers: { "x-hostel-id": hostelId || "" }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch fees");
    }

    return response.json();
  },

  /**
   * Manually creates a fee record.
   */
  async createFee(data, hostelId) {
    const response = await fetch("/api/fees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hostel-id": hostelId || "",
      },
      body: JSON.stringify({ ...data, hostelId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create fee record");
    }

    return response.json();
  }
};
