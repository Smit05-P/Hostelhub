"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import axios from "axios";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";

export default function JoinHostelModal({ isOpen, onClose, onSuccess }) {
  const [method, setMethod] = useState("code"); // "code" or "search"
  const [joinCode, setJoinCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hostels, setHostels] = useState([]);
  const { userData, user } = useAuth();

  if (!isOpen) return null;

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error("Please enter a join code");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/hostels/join", {
        joinCode: joinCode.toUpperCase(),
        userId: user.uid,
      });

      if (response.data.status === "pending") {
        toast.success(
          "Join request submitted! Waiting for admin approval."
        );
      } else if (response.data.status === "approved") {
        toast.success(`Welcome to ${response.data.hostelName}!`);
      }

      setJoinCode("");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Join error:", error);
      const message =
        error.response?.data?.error || "Failed to join hostel";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get("/api/hostels/search", {
        params: { query: searchQuery },
      });
      setSearchResults(response.data.hostels || []);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search hostels");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToJoin = async (hostelId) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/hostels/join-requests", {
        hostelId,
        userId: user.uid,
        userName: userData?.name,
      });

      toast.success(response.data.message);
      setSearchQuery("");
      setSearchResults([]);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Request error:", error);
      const message =
        error.response?.data?.error || "Failed to submit join request";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Join a Hostel
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Connect to a hostel for accommodation details and updates
          </p>
        </div>

        <div className="p-6">
          {/* Tab Switch */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMethod("code")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                method === "code"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Lock size={16} className="inline mr-2" />
              Join Code
            </button>
            <button
              onClick={() => setMethod("search")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                method === "search"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Search
            </button>
          </div>

          {/* Join Code Method */}
          {method === "code" && (
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hostel Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().slice(0, 8))
                  }
                  placeholder="e.g., HSTAB23X"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-widest text-center font-mono"
                  maxLength="8"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this code from your hostel owner
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || !joinCode.trim()}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? "Joining..." : "Join Hostel"}
              </button>
            </form>
          )}

          {/* Search Method */}
          {method === "search" && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Search by Hostel Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hostels..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? "..." : "Search"}
                  </button>
                </div>
              </form>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((hostel) => (
                    <div
                      key={hostel.id}
                      className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {hostel.hostelName}
                          </h3>
                          {hostel.address && (
                            <p className="text-sm text-gray-600">
                              {hostel.address}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRequestToJoin(hostel.id)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors whitespace-nowrap"
                        >
                          Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !loading && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <AlertCircle className="inline mr-2 mb-1" size={16} />
                  No hostels found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
