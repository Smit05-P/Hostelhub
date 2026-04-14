"use client";

import Link from "next/link";
import { Building2, Sparkles, ShieldCheck, Star } from "lucide-react";

export default function SaaSAuthLayout({ children, tagline = "Smarter Hostel Management" }) {
  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col md:flex-row overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Left Brand Panel (Premium Light Theme) */}
      <div className="hidden md:flex md:w-[40%] lg:w-[45%] bg-[#F8FAFF] relative flex-col justify-between p-12 overflow-hidden border-r border-slate-100">
        {/* Subtle Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #6366f1 1px, transparent 0)`, backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-[24px] font-extrabold text-slate-900 tracking-tight font-jakarta">HostelHub</span>
          </Link>
          
          <div className="mt-20 max-w-[440px]">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
                <Sparkles size={12} className="text-[#6366f1]" />
                <span className="text-[10px] font-bold text-[#6366f1] uppercase tracking-wider text-center">Transforming Living</span>
             </div>
             
             <h2 className="text-[40px] lg:text-[52px] leading-[1.1] font-extrabold text-slate-900 font-jakarta tracking-tight">
               The Future Of <br/>
               <span className="bg-gradient-to-br from-[#6366f1] to-[#3b82f6] text-transparent bg-clip-text">Hostel Living.</span>
             </h2>
             <p className="mt-6 text-slate-500 text-[18px] font-medium leading-[1.6]">
               {tagline} — Join 2,000+ hostels who have switched to smarter management.
             </p>
          </div>
        </div>

        {/* Dynamic Social Proof Card */}
        <div className="relative z-10 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-6 rounded-[24px] max-w-[340px]">
           <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#6366f1] shadow-sm ring-1 ring-indigo-100/50">
                 <Building2 size={24} />
              </div>
              <div className="flex flex-col">
                 <span className="text-slate-900 font-extrabold text-[20px]">14,000+</span>
                 <span className="text-slate-400 text-[11px] font-bold uppercase tracking-[1.5px]">Active Residents</span>
              </div>
           </div>
           
           <div className="flex flex-col gap-3 mb-5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                 <span>Occupancy Rate</span>
                 <span className="text-indigo-600">92%</span>
              </div>
              <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                 <div className="h-full w-[92%] bg-gradient-to-r from-[#6366f1] to-[#3b82f6] rounded-full" />
              </div>
           </div>

           <div className="flex items-center gap-1.5 pt-4 border-t border-slate-50">
              <div className="flex -space-x-2">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                 ))}
              </div>
              <div className="flex items-center gap-1 ml-2">
                 <Star size={10} className="fill-amber-400 text-amber-400" />
                 <span className="text-[11px] font-bold text-slate-600">4.9/5 Average Rating</span>
              </div>
           </div>
        </div>
      </div>

      {/* Right Form Panel (Clean Light Theme) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-[#FDFDFF]">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 bg-[#F8FAFF] opacity-40 -z-10" />
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full" />

        <div className="w-full max-w-[480px] relative z-10">
          {/* Mobile Header (Only on small screens) */}
          <div className="md:hidden flex flex-col items-center gap-3 mb-10 text-center">
             <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="text-[24px] font-extrabold text-slate-900 tracking-tight font-jakarta">HostelHub</span>
             </Link>
             <p className="text-[14px] font-semibold text-slate-500 tracking-wide uppercase px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">{tagline}</p>
          </div>

          {/* Form Card (Premium White Style) */}
          <div className="w-full bg-white rounded-[32px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.06),0_18px_36px_-18px_rgba(0,0,0,0.08)] p-8 sm:p-12 border border-slate-100 ring-1 ring-white">
            {children}
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-6 opacity-60">
             <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SSL Secure</span>
             </div>
             <div className="w-1 h-1 bg-slate-200 rounded-full" />
             <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">256-bit Encryption</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
