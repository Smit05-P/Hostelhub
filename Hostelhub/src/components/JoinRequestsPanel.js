"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { CheckCircle, XCircle, Users } from "lucide-react";

export default function JoinRequestsPanel({ hostelId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    if (hostelId) {
      fetchRequests();
    }
  }, [hostelId, filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/hostels/join-requests", {
        params: { hostelId, status: filter },
      });
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch join requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId) => {
    setActioningId(requestId);
    try {
      await axios.post(
        `/api/hostels/join-requests/${requestId}/approve`,
        { hostelId, userId }
      );
      toast.success("Request approved!");
      fetchRequests();
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(error.response?.data?.error || "Failed to approve");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (requestId, reason = "") => {
    setActioningId(requestId);
    try {
      await axios.post(
        `/api/hostels/join-requests/${requestId}/reject`,
        { reason }
      );
      toast.success("Request rejected");
      fetchRequests();
    } catch (error) {
      console.error("Reject error:", error);
      toast.error(error.response?.data?.error || "Failed to reject");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          <Users className="inline mr-2" size={24} />
          Join Requests
        </h2>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b">
          {["pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 font-medium capitalize transition-colors border-b-2 ${
                filter === status
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {filter} join requests
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Student Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Requested At
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Status
                </th>
                {filter === "pending" && (
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {req.userName}
                    </div>
                    <div className="text-sm text-gray-500">{req.userId}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(req.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        req.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : req.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  {filter === "pending" && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(req.id, req.userId)}
                          disabled={actioningId === req.id}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actioningId === req.id}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center gap-1"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
