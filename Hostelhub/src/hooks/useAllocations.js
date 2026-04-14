"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useAllocations(params = {}) {
  const { activeHostelId } = useAuth();
  const { status = "all" } = params;

  const query = useQuery({
    queryKey: ["allocations", activeHostelId, status],
    queryFn: async () => {
      if (!activeHostelId) return [];
      
      const searchParams = new URLSearchParams({
        hostelId: activeHostelId,
        status,
      });

      const res = await fetch(`/api/allocations?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch allocations");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return query;
}
