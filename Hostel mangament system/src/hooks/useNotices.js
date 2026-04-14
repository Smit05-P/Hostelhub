"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useNotices() {
  const { activeHostelId } = useAuth();

  const query = useQuery({
    queryKey: ["notices", activeHostelId],
    queryFn: async () => {
      if (!activeHostelId) return [];
      const searchParams = new URLSearchParams();
      searchParams.append("hostelId", activeHostelId);
      const res = await fetch(`/api/notices?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch notices");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 0,
    refetchInterval: 5000, // Re-check every 5 seconds for real-time vibe
  });

  return query;
}
