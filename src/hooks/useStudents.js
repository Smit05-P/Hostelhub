"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { studentService } from "@/services/studentService";

export function useStudents(params = {}) {
  const { activeHostelId } = useAuth();
  const { searchQuery = "", roomId = "all", status = "all", pageSize = 10, cursor = null } = params;

  const query = useQuery({
    queryKey: ["students", activeHostelId, searchQuery, roomId, status, pageSize, cursor],
    queryFn: async () => {
      if (!activeHostelId) return { students: [], nextCursor: null, hasMore: false };
      
      return studentService.getStudents({
        hostelId: activeHostelId,
        search: searchQuery,
        room_id: roomId,
        status: status,
        pageSize,
        cursor,
      });
    },
    enabled: !!activeHostelId,
    staleTime: 0,
    refetchInterval: 5000,          // Reduced polling further as part of audit
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  return query;
}
