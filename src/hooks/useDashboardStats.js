"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardStats() {
  const { activeHostelId } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", activeHostelId],
    queryFn: async () => {
      if (!activeHostelId) return null;
      const res = await fetch(`/api/dashboard/stats?hostelId=${activeHostelId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 30_000, // 30s fresh
    gcTime: 30 * 60 * 1000, // 30min cache
    placeholderData: (previousData) => previousData,
    refetchInterval: 60_000, // Sync every minute
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });
}
