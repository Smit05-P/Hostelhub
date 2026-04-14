"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useFees(params = {}) {
  const { activeHostelId } = useAuth();
  const { studentId, month, year, status } = params;

  const query = useQuery({
    queryKey: ["fees", activeHostelId, studentId, month, year, status],
    queryFn: async () => {
      if (!activeHostelId) return [];
      
      const searchParams = new URLSearchParams({
        hostelId: activeHostelId,
      });
      if (studentId) searchParams.append("studentId", studentId);
      if (month) searchParams.append("month", month);
      if (year) searchParams.append("year", year);
      if (status) searchParams.append("status", status);

      const res = await fetch(`/api/fees?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch fees");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return query;
}
