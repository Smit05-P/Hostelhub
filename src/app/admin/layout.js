"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminSidebar from "@/components/AdminSidebar";
import TopNavbar from "@/components/TopNavbar";

const IntelSidebar = dynamic(() => import("@/components/intel/IntelSidebar"), { ssr: false });
const IntelFAB = dynamic(() => import("@/components/intel/IntelFAB"), { ssr: false });

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isIntelOpen, setIsIntelOpen] = useState(false);
  const pathname = usePathname();

  const isCollectionPage = pathname === "/admin/hostels";

  // Global Page Load Animation
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (isCollectionPage) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <main suppressHydrationWarning className={`min-h-screen bg-background grain-overlay transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
          {children}
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div suppressHydrationWarning className={`flex h-screen overflow-hidden bg-background font-jakarta transition-opacity duration-1000 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Deep Navy Static Sidebar */}
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Main Content Area (Light & Airy) */}
        <div className="flex flex-col flex-1 overflow-hidden relative">
          
          {/* Subtle Background Glows (Organic) */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

          {/* Super Glass Top Bar */}
          <div className="w-full z-30">
             <TopNavbar onOpen={() => setIsSidebarOpen(true)} title="Management Node" />
          </div>
          
          <main className="flex-1 overflow-y-auto relative scrollbar-hide">
             <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-4 sm:py-6 animate-fade-in">
                {children}
             </div>
          </main>
        </div>

        {/* HostelHub Intel - AI Command Center */}
        <IntelSidebar isOpen={isIntelOpen} onClose={() => setIsIntelOpen(false)} />
        <IntelFAB onClick={() => setIsIntelOpen(true)} />
      </div>
    </ProtectedRoute>
  );
}
