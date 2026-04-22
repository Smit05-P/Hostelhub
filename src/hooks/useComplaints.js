"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    staleTime: 30 * 1000,              // Fresh for 30 seconds
    refetchInterval: 30 * 1000,         // Re-check every 30 seconds (was 10s — 3x reduction)
    refetchIntervalInBackground: false,  // Pause when tab not visible
    refetchOnWindowFocus: true,
  });

  return query;
}

export function useAddComplaint() {
  const queryClient = useQueryClient();
  const { activeHostelId } = useAuth();
  
  return useMutation({
    mutationFn: async (newComplaint) => {
      newComplaint.hostelId = activeHostelId;
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComplaint)
      });
      if (!res.ok) throw new Error("Failed to add complaint");
      return res.json();
    },
    onMutate: async (newComplaint) => {
      const queryKey = ["complaints", activeHostelId, undefined, undefined];
      await queryClient.cancelQueries({ queryKey });
      
      const previousComplaints = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old) => {
        // Append optimistically
        const optimisticEntry = { 
          id: `temp-${Date.now()}`, 
          ...newComplaint, 
          status: "pending",
          createdAt: new Date().toISOString()
        };
        return [...(old || []), optimisticEntry];
      });
      
      return { previousComplaints, queryKey };
    },
    onError: (err, newComplaint, context) => {
      queryClient.setQueryData(context.queryKey, context.previousComplaints);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    }
  });
}
