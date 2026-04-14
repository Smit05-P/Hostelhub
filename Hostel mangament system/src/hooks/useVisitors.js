"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useVisitors(params = {}) {
  const { activeHostelId } = useAuth();
  const { hostStudentId, status } = params;

  const query = useQuery({
    queryKey: ["visitors", activeHostelId, hostStudentId, status],
    queryFn: async () => {
      if (!activeHostelId) return [];
      
      const searchParams = new URLSearchParams({
        hostelId: activeHostelId,
      });
      if (hostStudentId) searchParams.append("hostStudentId", hostStudentId);
      if (status) searchParams.append("status", status);

      const res = await fetch(`/api/visitors?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch visitors");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return query;
}

export function useVisitorRequests() {
  const { activeHostelId } = useAuth();

  const query = useQuery({
    queryKey: ["visitor-requests", activeHostelId],
    queryFn: async () => {
      if (!activeHostelId) return [];
      const res = await fetch(`/api/visitors/admin/requests?hostelId=${activeHostelId}&status=pending`);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return query;
}
