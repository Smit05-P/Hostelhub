"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function usePayments(params = {}) {
  const { activeHostelId } = useAuth();
  const { studentId } = params;

  const query = useQuery({
    queryKey: ["payments", activeHostelId, studentId],
    queryFn: async () => {
      if (!activeHostelId) return [];
      
      const searchParams = new URLSearchParams({
        hostelId: activeHostelId,
      });
      if (studentId) searchParams.append("studentId", studentId);

      const res = await fetch(`/api/payments?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return query;
}
