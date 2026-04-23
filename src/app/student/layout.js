"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentSidebar from "@/components/StudentSidebar";
import TopNavbar from "@/components/TopNavbar";
import StudentMobileNav from "@/components/StudentMobileNav";


export default function StudentLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pathname = usePathname();

  // The hostel-selection page is full-screen and standalone
  const isStandalonePage = pathname?.startsWith("/student/select-hostel") || pathname?.startsWith("/student/pending");

  if (isStandalonePage) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <main suppressHydrationWarning className="min-h-screen bg-background grain-overlay animate-fade-in">
          {children}
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div suppressHydrationWarning className="flex h-screen overflow-hidden bg-background font-jakarta animate-fade-in">
        
        {/* Deep Navy Static Sidebar */}
        <StudentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Main Content Area (Light & Airy) */}
        <div suppressHydrationWarning className="flex flex-col flex-1 overflow-hidden relative">
          
          {/* Super Glass Top Bar */}
          <div suppressHydrationWarning className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
             <div suppressHydrationWarning className="max-w-[1400px] mx-auto px-4 sm:px-8">
                <TopNavbar onOpen={() => setIsSidebarOpen(true)} title="Resident Portal" />
             </div>
          </div>
          
          <main suppressHydrationWarning className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
             <div suppressHydrationWarning className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4 sm:py-6 animate-fade-in">
                {children}
             </div>
          </main>
        </div>

        {/* Mobile Navigation Hub */}
        <StudentMobileNav />


      </div>
    </ProtectedRoute>
  );
}

