"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { paymentService } from "@/services/paymentService";

export function useFees(params = {}) {
  const { activeHostelId } = useAuth();
  const { studentId, month, year, status } = params;

  const query = useQuery({
    queryKey: ["fees", activeHostelId, studentId, month, year, status],
    queryFn: async () => {
      if (!activeHostelId) return [];
      
      return paymentService.getFees({
        studentId,
        month,
        year,
        status,
        hostelId: activeHostelId
      });
    },
    enabled: !!activeHostelId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return query;
}

export function useAddPayment() {
  const queryClient = useQueryClient();
  const { activeHostelId } = useAuth();
  
  return useMutation({
    mutationFn: async (newPayment) => {
      return paymentService.addPayment({
        ...newPayment,
        hostelId: activeHostelId
      });
    },
    onMutate: async (newPayment) => {
      // Create a generic query key that covers all fees for this student/hostel
      // As we might not know exactly which query parameters they are currently viewing
      const queryKey = ["fees", activeHostelId, newPayment.studentId];
      
      // We don't cancel all queries stringently here because params vary widely,
      // but we invalidate correctly upon settlement.
      
      return { queryKey };
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["fees", activeHostelId] });
      // Invalidate dashboard stats as payment affects revenue
      queryClient.invalidateQueries({ queryKey: ["dashboardStats", activeHostelId] });
    }
  });
}
