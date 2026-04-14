"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useScrollAnimation } from "./hooks/useScrollAnimation";

export default function CTASection() {
  const [ref, inView] = useScrollAnimation({ triggerOnce: true });

  return (
    <section className="bg-[#FDFDFF] py-24 sm:py-32 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6">
        
        <div 
          ref={ref}
          className={`relative z-10 bg-slate-900 rounded-[48px] p-8 md:p-20 text-center flex flex-col items-center overflow-hidden transition-all duration-1000 ${inView ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.95]'}`}
        >
          {/* Animated Background Gradients */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full mb-8">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-[12px] font-bold text-white tracking-widest uppercase">Get Started Today</span>
          </div>

          <h2 className="text-[32px] md:text-[56px] font-extrabold text-white font-jakarta tracking-tighter leading-[1.1] max-w-[800px]">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Scale Your Hostel</span> Operations?
          </h2>
          
          <p className="mt-6 text-[18px] md:text-[20px] text-slate-300 font-medium leading-relaxed max-w-[600px]">
            Join 500+ managers who have simplified their business with HostelHub. No credit card required.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/register"
              className="h-[64px] px-10 rounded-2xl bg-white text-slate-900 font-extrabold text-[16px] hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
            >
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <Link 
              href="#demo"
              className="h-[64px] px-10 rounded-2xl bg-white/5 border border-white/20 text-white font-extrabold text-[16px] hover:bg-white/10 transition-all flex items-center justify-center"
            >
              Book a Demo
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-[13px] text-slate-400 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">✓ 14-Day Free Trial</div>
            <div className="flex items-center gap-2">✓ No Credit Card</div>
            <div className="flex items-center gap-2">✓ Cancel Anytime</div>
          </div>
        </div>

      </div>
    </section>
  );
}
