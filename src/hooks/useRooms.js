"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useRooms(options = {}) {
  const { activeHostelId } = useAuth();
  const { includeAll = true } = options;

  return useQuery({
    queryKey: ["rooms", activeHostelId, includeAll],
    queryFn: async () => {
      if (!activeHostelId) return [];
      const res = await fetch(`/api/rooms?hostelId=${activeHostelId}&all=${includeAll}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 30_000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });
}
