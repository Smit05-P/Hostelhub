"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export function useNotices() {
  const { activeHostelId } = useAuth();

  const query = useQuery({
    queryKey: ["notices", activeHostelId],
    queryFn: async () => {
      if (!activeHostelId) return [];
      const searchParams = new URLSearchParams();
      searchParams.append("hostelId", activeHostelId);
      const res = await fetch(`/api/notices?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch notices");
      return res.json();
    },
    enabled: !!activeHostelId,
    staleTime: 30 * 1000,              // Data is fresh for 30 seconds
    refetchInterval: 60 * 1000,         // Re-check every 60 seconds (was 5s — 12x reduction)
    refetchIntervalInBackground: false,  // Pause polling when tab is not visible
    refetchOnWindowFocus: true,          // Refetch when user returns to tab
  });

  return query;
}

export function useAddNotice() {
  const queryClient = useQueryClient();
  const { activeHostelId } = useAuth();
  
  return useMutation({
    mutationFn: async (newNotice) => {
      newNotice.hostelId = activeHostelId;
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotice)
      });
      if (!res.ok) throw new Error("Failed to create notice");
      return res.json();
    },
    onMutate: async (newNotice) => {
      const queryKey = ["notices", activeHostelId];
      await queryClient.cancelQueries({ queryKey });
      
      const previousNotices = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old) => {
        // Prepend optimistically as notices are usually newest-first
        const optimisticEntry = { 
          _id: `temp-${Date.now()}`, 
          ...newNotice, 
          timestamp: new Date().toISOString()
        };
        return [optimisticEntry, ...(old || [])];
      });
      
      return { previousNotices, queryKey };
    },
    onError: (err, newNotice, context) => {
      queryClient.setQueryData(context.queryKey, context.previousNotices);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: context.queryKey });
    }
  });
}
