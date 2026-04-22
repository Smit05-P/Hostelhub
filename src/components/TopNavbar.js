"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User as UserIcon, Bell, Building2, ChevronDown, Search, Heart, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import NotificationDropdown from "@/components/NotificationDropdown";

export default function TopNavbar({ title, onOpen }) {
  const { user, userData, activeHostelData } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const activeHostelName = activeHostelData?.hostelName || "Terminal Node";

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${
      isScrolled ? "py-2 bg-white/80 backdrop-blur-2xl shadow-xl shadow-slate-900/5" : "py-4 bg-white"
    }`}>
      <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between px-4 sm:px-8">
        
        {/* Left Section: Context & Title */}
        <div className="flex items-center gap-4 sm:gap-10 flex-1 min-w-0">
          <button 
            onClick={onOpen}
            className="lg:hidden p-2.5 text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 border border-slate-200 shrink-0"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
          
          <div className="flex flex-col min-w-0 justify-center">
             <div className="flex items-center gap-2.5 mb-1.5">
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] italic leading-none">Synchronized Hub</span>
             </div>
             <h2 className="text-lg sm:text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none truncate">
               {title}
             </h2>
          </div>

          {/* Search Protocol Hook */}
          <div className="hidden xl:flex items-center gap-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl w-full max-w-sm focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-600/5 focus-within:border-indigo-600/20 transition-all group h-12">
             <Search size={16} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors shrink-0" />
             <input 
               type="text" 
               placeholder="TERMINAL SEARCH..." 
               className="bg-transparent border-none outline-none text-[10px] font-black text-slate-900 placeholder:text-slate-300 flex-1 tracking-[0.1em] uppercase h-full"
             />
             <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black text-slate-300 shadow-sm group-focus-within:opacity-0 transition-opacity shrink-0">
                <span>CTRL</span>
                <span className="w-px h-2 bg-slate-100" />
                <span>K</span>
             </div>
          </div>
        </div>

        {/* Right Section: Node Info & Identity */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          
          {/* Institutional Badge */}
          <div className="hidden md:flex items-center gap-4 px-5 bg-slate-900 text-white rounded-[1.2rem] shadow-2xl shadow-slate-900/20 relative group overflow-hidden h-12">
             <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex flex-col items-end justify-center relative z-10">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-white/70 transition-colors leading-none mb-1">Primary Node</span>
                <span className="text-[10px] font-black italic tracking-tighter truncate max-w-[100px] uppercase leading-none">{activeHostelName}</span>
             </div>
             <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform shrink-0">
                <Building2 size={15} strokeWidth={2.5} />
             </div>
          </div>

          <div className="flex items-center">
            <NotificationDropdown />
          </div>
          
          {/* User Identity Module */}
          <div className="flex items-center gap-3 sm:gap-5 border-l border-slate-200 pl-3 sm:pl-6 h-12">
              <div className="hidden sm:flex flex-col items-end justify-center">
                 <p className="text-[11px] font-black text-slate-900 italic tracking-tighter uppercase leading-none mb-1.5 truncate max-w-[120px]">{userData?.name || user?.email?.split('@')[0]}</p>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 italic leading-none">Verified ID</span>
                 </div>
              </div>
              <div className="relative group shrink-0">
                 <div className="absolute inset-0 bg-indigo-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                 <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border-2 border-slate-100 p-0.5 shadow-2xl shadow-slate-900/10 group-hover:border-indigo-600/30 transition-all relative z-10 overflow-hidden rotate-3 group-hover:rotate-0">
                    <div className="w-full h-full rounded-[0.8rem] overflow-hidden bg-slate-50 flex items-center justify-center text-slate-300">
                      {userData?.profileImage ? (
                        <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black italic text-base">{user?.email?.[0].toUpperCase()}</span>
                      )}
                    </div>
                 </div>
              </div>
          </div>
        </div>
      </div>
    </header>


  );
}
