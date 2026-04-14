"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User as UserIcon, Bell, Building2, ChevronDown, Search, Heart, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import NotificationDropdown from "@/components/NotificationDropdown";

export default function TopNavbar({ title, onOpen }) {
  const { user, userData, role, activeHostelId, activeHostelData, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeHostelName = activeHostelData?.hostelName || "Select Node";

  return (
    <header className={`h-20 sticky top-0 z-30 transition-all duration-500 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-slate-200 shadow-sm ${isScrolled ? "h-16" : "h-20"}`}>
      
      {/* Mobile Menu Trigger */}
      <button 
        onClick={onOpen}
        className="md:hidden p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-xl transition-colors mr-2"
        aria-label="Toggle Menu"
      >
        <Menu size={24} />
      </button>
      
      {/* Search & Breadcrumb (SaaS Platinum Style) */}
      <div className="flex items-center gap-2 md:gap-10 flex-1 min-w-0">
        <div className="flex flex-col min-w-0 sm:min-w-[200px]">
          <h2 className={`font-jakarta font-black text-slate-900 tracking-tighter leading-none transition-all duration-500 truncate ${isScrolled ? "text-lg" : "text-xl sm:text-2xl"}`}>
            {title}
          </h2>
          {!isScrolled && (
            <p className="hidden sm:flex text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-2 items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.4)] shrink-0"></span>
              Synchronized Systems
            </p>
          )}
        </div>

        {/* Global Search Bar (Platinum Hook) */}
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-slate-100/50 border border-slate-200/60 rounded-2xl w-full max-w-md focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/5 focus-within:border-blue-600/20 transition-all group">
           <Search size={16} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
           <input 
             type="text" 
             placeholder="Search residents, rooms, or logs..." 
             className="bg-transparent border-none outline-none text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium flex-1 tracking-tight"
           />
           <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-400 shadow-sm group-focus-within:opacity-0 transition-opacity">
              <span>⌘</span>
              <span>K</span>
           </div>
        </div>
      </div>

      {/* Right Actions: Terminal Info & User Node */}
      <div className="flex items-center gap-2 sm:gap-6 shrink-0">
        
        {/* Active Node Branded Badge */}
        <div className="hidden lg:flex items-center gap-4 py-2 px-5 bg-indigo-600/5 border border-indigo-600/10 rounded-2xl shadow-inner relative group overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-600/5 blur-xl rounded-full translate-x-8 -translate-y-8" />
           <div className="flex flex-col items-end relative z-10">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Primary Node</span>
              <span className="text-[12px] font-bold text-indigo-600 truncate max-w-[150px] font-jakarta">{activeHostelName}</span>
           </div>
           <Building2 size={18} className="text-indigo-500 opacity-80 ml-1 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        </div>

        <div className="h-6 w-[1px] bg-slate-200 mx-2" />

        <NotificationDropdown />
        
        {/* User Node Profile */}
        <div className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 border-l border-saas-border">
            <div className="hidden sm:flex flex-col items-end">
               <p className="text-sm font-bold text-slate-900 leading-none truncate max-w-[120px]">{user?.email?.split('@')[0]}</p>
               <div className="flex items-center gap-1.5 mt-1.5">
                  <Heart size={10} className="fill-indigo-500 text-indigo-500 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">Authenticated</span>
               </div>
            </div>
            <div className="relative group cursor-pointer">
               <div className="absolute inset-0 bg-blue-600/10 blur-[15px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
               <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 font-bold shadow-lg shadow-slate-900/5 group-hover:border-blue-600/30 transition-all relative z-10 overflow-hidden">
                  <div className="absolute inset-0 bg-noise opacity-5" />
                  {userData?.profileImage ? (
                    <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.email?.[0].toUpperCase() || <UserIcon size={18} />
                  )}
               </div>
            </div>
        </div>
      </div>
    </header>
  );
}
