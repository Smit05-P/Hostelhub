"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

export function useHostels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ─── QUERY ─────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: ["hostels", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const res = await fetch(`/api/hostels?adminId=${user.uid}`);
      if (!res.ok) throw new Error("Failed to fetch hostels");
      return res.json();
    },
    enabled: !!user?.uid,
    staleTime: 0,          // Always show cached data but revalidate immediately
    refetchOnWindowFocus: true,
  });

  // ─── CREATE HOSTEL (Optimistic) ────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (newHostel) => {
      const res = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newHostel, adminId: user?.uid }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create hostel");
      }
      return res.json();
    },

    // 1. Optimistically add the new hostel to the cache before the API call
    onMutate: async (newHostel) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["hostels", user?.uid] });

      // Snapshot the previous value for rollback
      const previousHostels = queryClient.getQueryData(["hostels", user?.uid]);

      // Build a temporary optimistic hostel object
      const optimisticHostel = {
        id: `temp-${Date.now()}`,
        ...newHostel,
        adminId: user?.uid,
        totalStudents: 0,
        autoApprove: false,
        joinCode: "PENDING",
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      // Update the cache immediately
      queryClient.setQueryData(["hostels", user?.uid], (old = []) => [
        ...old,
        optimisticHostel,
      ]);

      // Return context for rollback
      return { previousHostels };
    },

    // 2. On success — replace temp entry with real data from server
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hostels", user?.uid] });
      toast.success("Hostel created successfully!", { icon: "🏨" });
    },

    // 3. On error — roll back to previous state
    onError: (error, _newHostel, context) => {
      if (context?.previousHostels) {
        queryClient.setQueryData(
          ["hostels", user?.uid],
          context.previousHostels
        );
      }
      toast.error(error.message);
    },
  });

  // ─── TOGGLE AUTO-APPROVE (Optimistic) ──────────────────────────────────────
  const toggleAutoApproveMutation = useMutation({
    mutationFn: async ({ hostelId, currentValue }) => {
      // Dynamically import to keep bundle lean on server
      const { db } = await import("@/lib/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "hostels", hostelId), {
        autoApprove: !currentValue,
      });
      return { hostelId, newValue: !currentValue };
    },

    // 1. Flip the toggle in cache immediately
    onMutate: async ({ hostelId, currentValue }) => {
      await queryClient.cancelQueries({ queryKey: ["hostels", user?.uid] });

      const previousHostels = queryClient.getQueryData(["hostels", user?.uid]);

      // Flip the autoApprove field for the matching hostel
      queryClient.setQueryData(["hostels", user?.uid], (old = []) =>
        old.map((h) =>
          h.id === hostelId ? { ...h, autoApprove: !currentValue } : h
        )
      );

      return { previousHostels };
    },

    // 2. Confirm with a toast on success
    onSuccess: ({ newValue }) => {
      toast.success(`Auto-Approve turned ${newValue ? "ON" : "OFF"}`, {
        icon: newValue ? "✅" : "🔒",
      });
    },

    // 3. Roll back on error
    onError: (error, _vars, context) => {
      if (context?.previousHostels) {
        queryClient.setQueryData(
          ["hostels", user?.uid],
          context.previousHostels
        );
      }
      toast.error("Failed to update auto-approve status");
    },
  });

  return {
    ...query,
    // Create
    createHostel: createMutation.mutate,
    isCreating: createMutation.isPending,
    // Toggle
    toggleAutoApprove: toggleAutoApproveMutation.mutate,
    isToggling: toggleAutoApproveMutation.isPending,
  };
}
