"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService } from "@/services/paymentService";

export function usePayments(params = {}) {
  const { activeHostelId } = useAuth();
  const { studentId } = params;

  const query = useQuery({
    queryKey: ["payments", activeHostelId, studentId],
    queryFn: async () => {
      if (!activeHostelId) return [];
      
      return paymentService.getPayments({
        studentId,
        hostelId: activeHostelId
      });
    },
    enabled: !!activeHostelId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return query;
}
