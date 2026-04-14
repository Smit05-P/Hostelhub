"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useStudents(params = {}) {
  const { activeHostelId } = useAuth();
  const { searchQuery = "", roomId = "all", status = "all", page = 1, limit = 10 } = params;

  const query = useQuery({
    queryKey: ["students", activeHostelId, searchQuery, roomId, status, page, limit],
    queryFn: async () => {
      if (!activeHostelId) return { students: [], total: 0 };
      
      const searchParams = new URLSearchParams({
        hostelId: activeHostelId,
        search: searchQuery,
        room_id: roomId,
        status: status,
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`/api/students?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 3000, // Background polling for instant UI updates
  });

  return query;
}
