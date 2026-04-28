"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useStudentDashboard() {
  const { user, hostelStatus } = useAuth();
  const studentId = user?._id || user?.id || user?.uid;

  return useQuery({
    queryKey: ["student-dashboard", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("User identity not initialized.");

      const res = await fetch("/api/student/dashboard", {
        cache: "no-store",
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { error: "Network stream interrupted." };
        }
        
        // Handle specific auth errors
        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        if (res.status === 403) {
          throw new Error("Access denied. Role mismatch detected.");
        }
        
        throw new Error(errorData.details || errorData.error || `System Error (${res.status})`);
      }
      
      const data = await res.json();
      return data;
    },
    // Only fetch if student is approved AND we have an ID
    enabled: !!studentId && (hostelStatus === "APPROVED" || hostelStatus === "Approved"),
    
    // UI Persistence logic
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    gcTime: 60 * 60 * 1000, // 1 hour cache to survive aggressive Vercel recycle
    
    // Aggressive but polite retry logic
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),

    // Refresh triggers
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}
