"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Play, CheckCircle2, LayoutDashboard, Users, CreditCard, ShieldCheck } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";
import { Button } from "./ui/Button";

export default function Hero() {
  const [heroRef, heroInView] = useScrollAnimation({ triggerOnce: true });
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const cycleWords = ["precision.", "confidence.", "speed.", "intelligence."];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % cycleWords.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [cycleWords.length]);

  return (
    <section className="relative min-h-[90vh] flex items-center pt-32 pb-20 overflow-hidden bg-[var(--background)]">
      {/* Subtle Background Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[var(--accent)] opacity-20 blur-[100px]"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full" ref={heroRef}>
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-8 items-center transition-all duration-1000 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          
          {/* Left Column: Copy & CTA */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-bold mb-6 border border-[var(--accent)]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
              </span>
              HostelHub 2.0 is now live
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-display font-bold text-[var(--foreground)] leading-[1.05] tracking-tight mb-8">
              Manage your hostel with{" "}
              <span className="inline-block overflow-hidden" style={{ verticalAlign: "bottom" }}>
                <span
                  key={wordIndex}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] inline-block"
                  style={{
                    animationName: "wordSlideIn",
                    animationDuration: "0.55s",
                    animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    animationFillMode: "both",
                  }}
                >
                  {cycleWords[wordIndex]}
                </span>
              </span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-[var(--muted-foreground)] mb-10 leading-relaxed max-w-xl font-medium">
              A complete operating system for modern student housing—handle admissions, collect payments, and manage rooms from one powerful dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button href="/register" className="w-full sm:w-auto h-12 px-8 shadow-accent-lg text-base">
                Start Free Trial <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsVideoOpen(true)}
                className="w-full sm:w-auto h-12 px-8 text-base bg-white !text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                <Play size={18} className="mr-2 text-[var(--accent)]" /> Watch Demo
              </Button>
            </div>
            
            <div className="mt-10 flex items-center gap-6 text-sm font-medium text-[var(--muted-foreground)]">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> 14-day free trial</div>
            </div>
          </div>

          {/* Right Column: Clean UI Mockup */}
          <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden flex flex-col scale-[0.95] sm:scale-100 transition-transform">
            {/* Mockup Header */}
            <div className="h-12 border-b border-[var(--border)] bg-slate-50 flex items-center px-4 justify-between shrink-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="px-3 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-400 font-mono flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" /> app.hostelhub.com
              </div>
              <div className="w-16"></div> {/* Spacer for symmetry */}
            </div>

            {/* Mockup Body */}
            <div className="flex-1 flex bg-[#F8FAFC] overflow-hidden">
              {/* Sidebar */}
              <div className="hidden sm:flex w-16 md:w-48 border-r border-[var(--border)] bg-white flex-col p-3 gap-2 shrink-0">
                <div className="h-8 bg-slate-100 rounded-md mb-4 flex items-center px-2 gap-2 text-slate-400">
                  <div className="w-4 h-4 rounded bg-[var(--accent)] shrink-0"></div>
                  <div className="h-2 w-16 bg-slate-200 rounded hidden md:block"></div>
                </div>
                <div className="h-8 bg-[var(--accent)]/10 text-[var(--accent)] rounded-md flex items-center px-2 gap-2">
                  <LayoutDashboard size={16} />
                  <span className="text-xs font-semibold hidden md:block">Dashboard</span>
                </div>
                <div className="h-8 hover:bg-slate-50 text-slate-500 rounded-md flex items-center px-2 gap-2 transition-colors">
                  <Users size={16} />
                  <span className="text-xs font-semibold hidden md:block">Students</span>
                </div>
                <div className="h-8 hover:bg-slate-50 text-slate-500 rounded-md flex items-center px-2 gap-2 transition-colors">
                  <CreditCard size={16} />
                  <span className="text-xs font-semibold hidden md:block">Payments</span>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-4 md:p-6 flex flex-col gap-4">
                {/* Top Nav */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <div>
                    <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 w-48 bg-slate-100 rounded"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold ring-2 ring-white">AD</div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { label: "Total Revenue", val: "$14,500", trend: "+12%" },
                    { label: "Occupied Beds", val: "248/250", trend: "99%" },
                    { label: "Pending Issues", val: "4", trend: "-2" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                      <div className="text-2xl font-bold text-slate-900">{stat.val}</div>
                      <div className="text-xs font-medium text-emerald-500">{stat.trend} this month</div>
                    </div>
                  ))}
                </div>

                {/* Chart Area */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col mt-2">
                  <div className="h-4 w-24 bg-slate-200 rounded mb-6"></div>
                  <div className="flex-1 flex items-end gap-2 px-2">
                    {[40, 70, 45, 90, 65, 85, 100].map((h, j) => (
                      <div key={j} className="flex-1 bg-indigo-50 rounded-t-md relative group">
                        <div className="absolute bottom-0 w-full bg-[var(--accent)] rounded-t-md transition-all duration-500 group-hover:opacity-80" style={{ height: `${h}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fade Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--card)] to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Video Modal Placeholder */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden aspect-video border border-slate-800 shadow-2xl relative">
            <button 
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 transition-colors"
            >
              Close
            </button>
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <Play size={48} className="mb-4 text-white opacity-50" />
              <p>Demo Video Player (Placeholder)</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
