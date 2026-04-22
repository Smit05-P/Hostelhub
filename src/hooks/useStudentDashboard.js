"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useStudentDashboard() {
  const { user, hostelStatus } = useAuth();
  const studentId = user?._id || user?.id || user?.uid;

  return useQuery({
    queryKey: ["student-dashboard", studentId],
    queryFn: async () => {
      console.log("[DASHBOARD-HOOK] Fetching dashboard data for:", studentId);
      const res = await fetch("/api/student/dashboard");
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { error: "Could not parse error response" };
        }
        console.error("[DASHBOARD-HOOK] Failed to fetch:", res.status, errorData);
        throw new Error(errorData.details || errorData.error || `Failed to fetch student dashboard: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("[DASHBOARD-HOOK] Data fetched successfully");
      return data;
    },
    enabled: !!studentId && hostelStatus === "APPROVED",
    staleTime: 0,
    refetchInterval: 5000, // Sync every 5 seconds for "real-time" feel
    placeholderData: (previousData) => previousData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
