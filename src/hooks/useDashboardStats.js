"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardStats() {
  const { activeHostelId } = useAuth();

  const query = useQuery({
    queryKey: ["dashboard-stats", activeHostelId],
    queryFn: async () => {
      if (!activeHostelId) return null;
      const res = await fetch(`/api/dashboard/stats?hostelId=${activeHostelId}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 0,
    placeholderData: (previousData) => previousData,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  return query;
}
