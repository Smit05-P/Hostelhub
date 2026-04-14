"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading, isHostelSelected, activeHostelId, hasPendingRequest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated — go to login
        router.replace("/login");
        return;
      }

      // 1. Role-based protection: Redirect if role doesn't match allowedRoles
      if (allowedRoles && role && !allowedRoles.includes(role)) {
        const dashRoute = role === "admin" ? "/admin/dashboard" : "/student/dashboard";
        router.replace(dashRoute);
        return;
      }

      // 2. Admin Specific Guards
      if (role === "admin" && !isHostelSelected && !pathname.includes("/admin/hostels")) {
        router.replace("/admin/hostels");
        return;
      }

      // 3. Student Specific Guards (The Core Fix)
      if (role === "student") {
        const inPendingPage = pathname === "/student/pending";
        const inSelectPage = pathname === "/student/select-hostel";

        if (activeHostelId) {
          // State: APPROVED
          if (inPendingPage || inSelectPage) {
            router.replace("/student/dashboard");
          }
        } else if (hasPendingRequest) {
          // State: PENDING
          if (!inPendingPage) {
            router.replace("/student/pending");
          }
        } else {
          // State: NO_HOSTEL
          if (!inSelectPage) {
            router.replace("/student/select-hostel");
          }
        }
      }
    }
  }, [user, role, loading, isHostelSelected, activeHostelId, hasPendingRequest, pathname, router, allowedRoles]);

  // Show loader while auth state is resolving
  if (loading || (user && !role)) {
    return (
      <div suppressHydrationWarning className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Handle redirects visually (return null while redirecting)
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(role)) return null;

  if (role === "student") {
    if (activeHostelId && (pathname === "/student/pending" || pathname === "/student/select-hostel")) return null;
    if (!activeHostelId && hasPendingRequest && pathname !== "/student/pending") return null;
    if (!activeHostelId && !hasPendingRequest && pathname !== "/student/select-hostel") return null;
  }

  return children;
}
