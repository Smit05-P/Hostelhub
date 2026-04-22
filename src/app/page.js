"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import LandingPage from "@/components/landing/LandingPage";
import ForceLightMode from "@/components/ForceLightMode";

export default function Home() {
  const { user, role, hostelStatus, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (role === "admin") {
        router.replace("/admin/hostels");
      } else if (role === "student") {
        // Universal Student Redirection Map
        const status = hostelStatus?.toUpperCase() || "NO_HOSTEL";
        const paths = {
          APPROVED: "/student/dashboard",
          PENDING: "/student/pending",
          REJECTED: "/student/select-hostel",
          NO_HOSTEL: "/student/select-hostel",
        };
        const target = paths[status] || "/student/select-hostel";
        router.replace(target);
      }
    }
  }, [user, role, hostelStatus, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50" suppressHydrationWarning>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Initializing HostelHub...</h2>
        </div>
      </div>
    );
  }

  // If not loading and no user, show the landing page
  if (!user) {
    return (
      <>
        <ForceLightMode />
        <LandingPage />
      </>
    );
  }

  // Fallback while redirecting for logged-in users
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50" suppressHydrationWarning>
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Redirecting to Dashboard...</h2>
      </div>
    </div>
  );
}

