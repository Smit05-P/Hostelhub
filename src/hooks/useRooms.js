"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useRooms(options = {}) {
  const { activeHostelId } = useAuth();
  const { includeAll = true } = options;

  const query = useQuery({
    queryKey: ["rooms", activeHostelId, includeAll],
    queryFn: async () => {
      if (!activeHostelId) return [];
      const res = await fetch(`/api/rooms?hostelId=${activeHostelId}&all=${includeAll}`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });

  return query;
}
