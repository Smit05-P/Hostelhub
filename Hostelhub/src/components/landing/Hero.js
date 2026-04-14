"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Users, DoorOpen, IndianRupee, Bell, 
  Search, Home, TrendingUp, ShieldCheck, Star, Building2, Play, Loader2
} from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [isRedirecting, setIsRedirecting] = useState(false);

  const [heroRef, heroInView] = useScrollAnimation({ triggerOnce: true });
  const [dashRef, dashInView] = useScrollAnimation({ triggerOnce: true, threshold: 0.2 });

  return (
    <section className="relative min-h-[100vh] overflow-hidden pt-32 pb-20 font-sans">
      {/* Background gradients with Parallax Effect */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#6366f1]/5 rounded-full blur-[120px] pointer-events-none will-change-transform"
        style={{ transform: `translate(-50%, ${scrollY * 0.4}px)` }}
      />
      <div 
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#3b82f6]/5 rounded-full blur-[100px] pointer-events-none will-change-transform"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      />
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{
          backgroundImage: "linear-gradient(rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-6 flex flex-col items-center text-center z-10" ref={heroRef}>
        
        <div className={`flex flex-col items-center w-full transition-all duration-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Top Badge */}
          <div className="inline-flex items-center justify-center gap-2 h-[34px] px-4 bg-white border border-slate-200/80 rounded-full mb-8 shadow-sm backdrop-blur-sm transition-colors hover:bg-slate-50 cursor-pointer">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] md:text-[12px] font-bold text-[#6366f1] tracking-[0.8px] uppercase">
              Now live — <span className="text-slate-500">Trusted by 14,000+ residents</span>
            </span>
          </div>

          {/* Headline */}
          <div className="max-w-[850px] w-full">
            <h1 className="text-[40px] md:text-[56px] lg:text-[72px] leading-[1.05] font-extrabold text-slate-900 font-jakarta tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#3b82f6]">The Smarter Way</span> To<br className="hidden md:block" /> Manage Your Hostel
            </h1>
            <h2 className="text-[32px] md:text-[48px] lg:text-[60px] leading-[1.2] font-extrabold text-slate-600 font-jakarta mt-3 tracking-tight">
              All In One Place.
            </h2>
          </div>

          {/* Subtext */}
          <p className="mt-5 md:mt-6 text-[16px] md:text-[18px] text-slate-500 max-w-[650px] leading-relaxed font-medium">
            HostelHub gives admins and students a powerful platform to manage rooms, payments, visitors, and complaints — all from one beautiful dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 md:mt-10 flex flex-col md:flex-row justify-center items-center gap-4 w-full md:w-auto px-4 md:px-0">
            <button 
              onClick={() => setIsRedirecting(true)}
              disabled={isRedirecting}
              className={`w-full md:w-auto flex items-center justify-center min-h-[50px] px-8 text-[15px] font-semibold bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.39)] transition-all ${isRedirecting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <Link href="/register" className="w-full flex justify-center items-center">
                   Start Free Trial →
                </Link>
              )}
            </button>
            <div className="w-full md:w-auto flex items-center justify-center text-[15px] font-bold text-slate-500 cursor-pointer hover:text-slate-800 transition-colors gap-2 min-h-[50px] px-6">
               Watch Demo <Play size={14} className="fill-current text-slate-500" />
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-[12px] md:text-[13px] text-slate-500 font-bold tracking-[0.5px] uppercase">
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#3b82f6]" /> HIPAA Compliant</div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-200"></div>
            <div className="flex items-center gap-2"><Star size={16} className="text-[#f59e0b] fill-[#f59e0b]" /> 4.9/5 Rating</div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-200"></div>
            <div className="flex items-center gap-2"><Building2 size={16} className="text-[#10b981]" /> 2000+ Hostels</div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div 
          ref={dashRef}
          className={`mt-14 sm:mt-16 relative w-full max-w-[1200px] transition-all duration-[1000ms] delay-300 ease-out will-change-transform ${dashInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
          style={{ transform: dashInView ? `translateY(${-scrollY * 0.05}px)` : '' }}
        >
          {/* Floating Stat Cards (Hidden on Mobile) */}
          <div className="hidden lg:block absolute -left-12 -top-6 bg-white/90 backdrop-blur-md p-4 rounded-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-20 animate-float border border-slate-100" style={{ animationDelay: '0ms' }}>
            <span className="text-[#10b981] font-bold text-[14px]">↑ 40% Faster Operations</span>
          </div>
          <div className="hidden lg:block absolute -right-8 top-12 bg-white/90 backdrop-blur-md p-4 rounded-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-20 animate-float border border-slate-100" style={{ animationDelay: '1000ms' }}>
            <span className="text-slate-900 font-bold text-[14px]">🏠 2,847 Rooms Managed</span>
          </div>
          <div className="hidden lg:block absolute -left-8 bottom-24 bg-white/90 backdrop-blur-md border border-slate-100 p-4 rounded-[12px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-20 animate-float" style={{ animationDelay: '2000ms' }}>
            <span className="text-[#6366f1] font-bold text-[14px]">⭐ 4.9 Admin Rating</span>
          </div>

          <div className="relative rounded-t-[12px] sm:rounded-t-[20px] border border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden mx-auto w-full md:w-[90%] lg:w-full">
            {/* Browser Chrome */}
            <div className="h-[24px] sm:h-[32px] bg-slate-50 flex items-center px-4 border-b border-slate-200/80">
              <div className="flex gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#EF4444]" />
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#F59E0B]" />
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#10B981]" />
              </div>
              <div className="mx-auto text-[10px] sm:text-[12px] text-slate-500 font-mono">app.hostelhub.com</div>
            </div>
            
            {/* Dashboard Mockup - Light Premium UI */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-50/50 flex overflow-hidden font-sans text-left">
              
              {/* Sidebar */}
              <div className="w-[140px] md:w-[170px] bg-white border-r border-slate-200/80 hidden sm:flex flex-col shrink-0 z-10">
                 <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-900 text-[13px] md:text-[14px]">
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-[#6366f1] rounded-md flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Home size={12} className="md:w-3.5 md:h-3.5" />
                    </div>
                    HostelHub
                 </div>
                 <div className="p-2 md:p-3 flex flex-col gap-1.5 flex-1">
                    <div className="text-[9px] md:text-[10px] uppercase font-bold text-slate-400 mb-2 mt-2 px-2 tracking-wider">Overview</div>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] md:text-[12px] font-semibold bg-[#6366f1]/10 text-[#6366f1] shadow-[inset_2px_0_0_0_#6366f1]">
                      <LayoutDashboard size={14} className="text-[#6366f1]" /> Dashboard
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] md:text-[12px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                      <Users size={14} /> Students
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] md:text-[12px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                      <DoorOpen size={14} /> Rooms
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] md:text-[12px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                      <IndianRupee size={14} /> Fees
                    </div>
                 </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden relative z-0">
                {/* Top Nav */}
                <div className="h-10 md:h-12 bg-white/80 backdrop-blur border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 shrink-0 relative z-10">
                  <div className="font-bold text-slate-800 text-[12px] md:text-[14px] tracking-tight truncate">
                    Welcome back, Admin
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 shrink-0">
                    <div className="relative hidden md:block">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Search..." className="bg-slate-100/80 border border-slate-200/50 rounded-full pl-7 pr-3 py-1.5 text-[10px] md:text-[11px] w-36 md:w-48 text-slate-600 outline-none placeholder-slate-400" readOnly />
                    </div>
                    <div className="text-slate-500 relative shrink-0">
                      <Bell size={14} className="md:w-4 md:h-4 text-slate-500" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#ef4444] rounded-full border border-white"></span>
                    </div>
                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#3b82f6] flex items-center justify-center shrink-0 text-white font-bold text-[9px] md:text-[10px] shadow-sm">
                      AD
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-3 md:p-5 bg-transparent flex flex-col gap-3 md:gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {/* Stat Cards */}
                    <div className="bg-white rounded-[10px] md:rounded-[12px] p-3 md:p-4 border border-slate-200/80 shadow-sm">
                      <div className="text-[10px] md:text-[11px] font-medium text-slate-500">Total Revenue</div>
                      <div className="text-[16px] md:text-[20px] font-extrabold text-slate-900 mt-0.5 md:mt-1 truncate">₹ 14.5L</div>
                      <div className="text-[9px] md:text-[10px] text-[#10b981] font-medium flex items-center gap-1 mt-1 truncate"><TrendingUp size={10}/> +15% vs last month</div>
                    </div>
                    <div className="bg-white rounded-[10px] md:rounded-[12px] p-3 md:p-4 border border-slate-200/80 shadow-sm">
                      <div className="text-[10px] md:text-[11px] font-medium text-slate-500">Occupancy Rate</div>
                      <div className="text-[16px] md:text-[20px] font-extrabold text-slate-900 mt-0.5 md:mt-1 truncate">94%</div>
                      <div className="w-full bg-slate-100 h-1 md:h-1.5 rounded-full mt-1.5 md:mt-2 overflow-hidden"><div className="bg-[#6366f1] w-[94%] h-full rounded-full"></div></div>
                    </div>
                    <div className="bg-white rounded-[10px] md:rounded-[12px] p-3 md:p-4 border border-slate-200/80 shadow-sm">
                      <div className="text-[10px] md:text-[11px] font-medium text-slate-500">Pending Complaints</div>
                      <div className="text-[16px] md:text-[20px] font-extrabold text-slate-900 mt-0.5 md:mt-1 truncate">12</div>
                      <div className="text-[9px] md:text-[10px] text-slate-500 font-medium mt-1 truncate">4 critical issues</div>
                    </div>
                    <div className="bg-white rounded-[10px] md:rounded-[12px] p-3 md:p-4 border border-slate-200/80 shadow-sm hidden md:block">
                      <div className="text-[10px] md:text-[11px] font-medium text-slate-500">Available Beds</div>
                      <div className="text-[16px] md:text-[20px] font-extrabold text-slate-900 mt-0.5 md:mt-1 truncate">45</div>
                      <div className="text-[9px] md:text-[10px] text-slate-500 font-medium mt-1 truncate">In Block A & C</div>
                    </div>
                  </div>

                  {/* Chart area */}
                  <div className="bg-white rounded-[10px] md:rounded-[12px] border border-slate-200/80 shadow-sm overflow-hidden flex-1 min-h-[100px] flex flex-col p-3 md:p-4 relative">
                    <h3 className="font-bold text-slate-900 text-[11px] md:text-[13px]">Admissions Trend</h3>
                    <div className="flex-1 flex items-end gap-1.5 md:gap-2 w-full pt-3 z-10">
                      {[30, 45, 60, 40, 80, 55, 95, 70, 85, 100, 75, 90, 60, 85].map((h, j) => (
                        <div key={j} className="flex-1 bg-indigo-50/50 rounded-t-[3px] relative flex items-end justify-center h-full">
                          <div className="w-full bg-gradient-to-t from-[#6366f1] to-[#3b82f6] rounded-t-[3px] opacity-90 shadow-[0_0_10px_rgba(99,102,241,0.1)]" style={{ height: `${h}%` }}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

               {/* Fade Overlay */}
               <div className="absolute inset-x-0 bottom-0 h-[40%] md:h-[50%] bg-gradient-to-t from-[#FDFDFF] via-[#FDFDFF]/80 to-transparent pointer-events-none z-50 translate-y-1" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
