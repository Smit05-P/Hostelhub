"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import StudentSidebar from "@/components/StudentSidebar";
import TopNavbar from "@/components/TopNavbar";
import IntelSidebar from "@/components/intel/IntelSidebar";
import IntelFAB from "@/components/intel/IntelFAB";

export default function StudentLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const pathname = usePathname();

  // The hostel-selection page is full-screen and standalone
  const isStandalonePage = pathname?.startsWith("/student/select-hostel") || pathname?.startsWith("/student/pending");

  // Global Page Load Animation


  if (isStandalonePage) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <main className="min-h-screen bg-background grain-overlay animate-fade-in">
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
        <div className="flex flex-col flex-1 overflow-hidden relative">
          
          
          {/* Main Content Area (Light & Airy) */}
          {/* Super Glass Top Bar */}
          <div className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
             <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
                <TopNavbar onOpen={() => setIsSidebarOpen(true)} title="Resident Portal" />
             </div>
          </div>
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
             <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-10 animate-fade-in translate-y-4 duration-700 forwards">
                {children}
             </div>
          </main>
        </div>

        {/* HostelHub Intel - AI Assistant */}
        <IntelSidebar isOpen={isIntelOpen} onClose={() => setIsIntelOpen(false)} />
        <IntelFAB onClick={() => setIsIntelOpen(true)} />
      </div>
    </ProtectedRoute>
  );
}
