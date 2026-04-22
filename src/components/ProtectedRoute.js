"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading, isHostelSelected, activeHostelId, hasPendingRequest, hostelStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Role-based Path Mapping for Students
  const studentPaths = {
    APPROVED: "/student/dashboard",
    PENDING: "/student/pending",
    REJECTED: "/student/select-hostel",
    NO_HOSTEL: "/student/select-hostel",
  };

  useEffect(() => {
    if (loading) return;

    // 1. Authentication Check
    if (!user) {
      if (pathname !== "/login") router.replace("/login");
      return;
    }

    // 2. Role Authorization
    if (allowedRoles && !allowedRoles.includes(role)) {
      const fallback = role === "admin" ? "/admin/dashboard" : "/student/select-hostel";
      if (pathname !== fallback) router.replace(fallback);
      return;
    }

    // 3. Admin Redirection Controller
    if (role === "admin") {
      if (!activeHostelId && !pathname.startsWith("/admin/hostels")) {
        router.replace("/admin/hostels");
      }
      return;
    }

    // 4. Student Redirection Controller (The Oracle)
    if (role === "student") {
      const status = hostelStatus?.toUpperCase() || "NO_HOSTEL";
      const target = studentPaths[status] || "/student/select-hostel";

      // Validation logic: APPROVED users can access any valid dashboard sub-route within the student module
      const isApprovedInModule = status === "APPROVED" && 
                                  pathname.startsWith("/student") && 
                                  !["/student/select-hostel", "/student/pending"].includes(pathname);
                                  
      const isOnCorrectStatusPage = pathname === target;

      if (!isApprovedInModule && !isOnCorrectStatusPage) {
        console.log(`[AUTH-ORACLE] Redirection triggered: ${status} -> ${target}`);
        router.replace(target);
      }
    }
  }, [user, role, loading, activeHostelId, hostelStatus, pathname, router]);

  // Unified Rendering Logic
  if (loading || (user && !role)) {
    return (
      <div suppressHydrationWarning className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Not authenticated
  if (!user && pathname !== "/login") return null;

  // The Oracle manages movement in the background; children are always rendered 
  // if authenticated to prevent UI flicker and "spinner traps".
  return children;
}
