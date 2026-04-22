"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";

export function useHostels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // ─── QUERY ─────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ["hostels", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await axios.get(`/api/hostels?adminId=${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // ─── CREATE HOSTEL (Optimistic) ────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (newHostel) => {
      const { data } = await axios.post("/api/hostels", { 
        ...newHostel, 
        adminId: userId 
      });
      return data;
    },

    onMutate: async (newHostel) => {
      await queryClient.cancelQueries({ queryKey: ["hostels", userId] });
      const previousHostels = queryClient.getQueryData(["hostels", userId]);

      const optimisticHostel = {
        _id: `temp-${Date.now()}`,
        ...newHostel,
        adminId: userId,
        totalStudents: 0,
        autoApprove: false,
        joinCode: "PENDING",
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(["hostels", userId], (old = []) => [
        ...old,
        optimisticHostel,
      ]);

      return { previousHostels };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hostels", userId] });
      toast.success("Hostel created successfully!", { icon: "🏨" });
    },

    onError: (error, _newHostel, context) => {
      if (context?.previousHostels) {
        queryClient.setQueryData(["hostels", userId], context.previousHostels);
      }
      toast.error(error.response?.data?.error || error.message);
    },
  });

  // ─── TOGGLE AUTO-APPROVE (Optimistic) ──────────────────────────────────────
  const toggleAutoApproveMutation = useMutation({
    mutationFn: async ({ hostelId, currentValue }) => {
      const { data } = await axios.patch(`/api/hostels/${hostelId}`, {
        autoApprove: !currentValue,
      });
      return { hostelId, newValue: !currentValue };
    },

    onMutate: async ({ hostelId, currentValue }) => {
      await queryClient.cancelQueries({ queryKey: ["hostels", userId] });
      const previousHostels = queryClient.getQueryData(["hostels", userId]);

      queryClient.setQueryData(["hostels", userId], (old = []) =>
        old.map((h) =>
          (h._id === hostelId || h.id === hostelId) ? { ...h, autoApprove: !currentValue } : h
        )
      );

      return { previousHostels };
    },

    onSuccess: ({ newValue }) => {
      // Invalidate to sync with DB truth immediately
      queryClient.invalidateQueries({ queryKey: ["hostels", userId] });
      toast.success(`Auto-Approve turned ${newValue ? "ON" : "OFF"}`, {
        icon: newValue ? "✅" : "🔒",
      });
    },

    onError: (error, _vars, context) => {
      if (context?.previousHostels) {
        queryClient.setQueryData(["hostels", userId], context.previousHostels);
      }
      toast.error("Failed to update auto-approve status");
    },
  });

  return {
    ...query,
    createHostel: createMutation.mutate,
    isCreating: createMutation.isPending,
    toggleAutoApprove: toggleAutoApproveMutation.mutate,
    isToggling: toggleAutoApproveMutation.isPending,
  };
}
