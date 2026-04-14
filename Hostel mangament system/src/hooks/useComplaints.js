"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useComplaints(params = {}) {
  const { activeHostelId } = useAuth();
  const { studentId, status } = params;

  const query = useQuery({
    queryKey: ["complaints", activeHostelId, studentId, status],
    queryFn: async () => {
      if (!activeHostelId) return [];
      const searchParams = new URLSearchParams();
      searchParams.append("hostelId", activeHostelId);
      if (studentId) searchParams.append("studentId", studentId);
      if (status) searchParams.append("status", status);

      const res = await fetch(`/api/complaints?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch complaints");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 0,
    refetchInterval: 10000, // Every 10 seconds
  });

  return query;
}
