"use client";

import Link from "next/link";
import { Building2, Users, CheckCircle2, Star } from "lucide-react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function SaaSAuthLayout({ children, tagline = "Smarter Hostel Management" }) {
  // Magnetic effect for logo
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 200 };
  const logoX = useSpring(mouseX, springConfig);
  const logoY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x * 0.15);
    mouseY.set(y * 0.15);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden font-sans selection:bg-[#4F46E5]/30">
      
      {/* LEFT PANEL (55%): Branding Side */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex md:w-[55%] lg:w-[50%] bg-[#0F0F1A] relative flex-col justify-between p-12 lg:p-20 overflow-hidden border-r border-white/5"
      >
        {/* ... (Mesh code remains same) ... */}
        {/* Animated Gradient Mesh / Blobs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              x: [0, 80, -40, 0], 
              y: [0, 100, 60, 0],
              scale: [1, 1.3, 0.8, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/20 blur-[140px] rounded-full" 
          />
          <motion.div 
            animate={{ 
              x: [0, -60, 40, 0], 
              y: [0, -80, -40, 0],
              scale: [1, 1.2, 0.9, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-20%] left-[-15%] w-[700px] h-[700px] bg-violet-600/20 blur-[130px] rounded-full" 
          />
          <div className="absolute inset-0 opacity-[0.05]" 
               style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #4F46E5 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10">
          <motion.div
            style={{ x: logoX, y: logoY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="inline-block"
          >
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="w-13 h-13 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-500">
                <Building2 size={26} strokeWidth={2.5} />
              </div>
              <span className="text-[32px] font-black text-white tracking-tight font-sora">HostelHub</span>
            </Link>
          </motion.div>
          
          <div className="mt-28 max-w-[580px]">
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.3 }}
               className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-10 backdrop-blur-sm shadow-xl"
             >
                <span className="text-amber-400">⭐</span>
                <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.25em]">The Gold Standard</span>
             </motion.div>
             
             <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
               className="text-[64px] lg:text-[76px] leading-[0.95] font-extrabold text-white font-sora tracking-tight"
             >
               Elevate Your <br/>
               <span className="bg-gradient-to-r from-[#4F46E5] via-[#818cf8] to-[#c084fc] text-transparent bg-clip-text">Hostel Experience.</span>
             </motion.h2>

             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.5 }}
               className="mt-10 space-y-4"
             >
                <p className="text-white/80 text-[22px] font-medium leading-[1.4] font-dm">
                  Smarter Hostel Management
                </p>
                <p className="text-white/50 text-[17px] font-medium leading-[1.6] max-w-[480px]">
                  Enterprise-grade platform designed for the next generation of modern living spaces and communities.
                </p>
             </motion.div>
          </div>
        </div>

        {/* Floating Stat Card with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 bg-white/[0.03] backdrop-blur-[24px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.3)] p-9 rounded-[40px] max-w-[420px] animate-float"
        >
           <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 rounded-3xl bg-[#4F46E5]/20 flex items-center justify-center text-[#818cf8] border border-white/5">
                 <Users size={32} strokeWidth={2} />
              </div>
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                   <span className="text-white font-black text-[30px] font-sora tracking-tight">14.2k</span>
                   <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                     <CheckCircle2 size={14} className="text-white" />
                   </div>
                 </div>
                 <span className="text-white/40 text-[13px] font-bold uppercase tracking-[0.15em]">Active Residents</span>
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center justify-between text-[14px] font-bold">
                 <span className="text-white/60">Platform Uptime</span>
                 <span className="text-emerald-400 font-mono">99.9%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-[3px]">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "99.9%" }}
                   transition={{ duration: 2, delay: 1.2, ease: "easeOut" }}
                   className="h-full bg-gradient-to-r from-emerald-400 to-[#10b981] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                 />
              </div>
           </div>

           <div className="flex items-center gap-4 mt-10 pt-8 border-t border-white/5">
              <div className="flex -space-x-3.5">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-[#161622] bg-white/10 overflow-hidden shadow-lg">
                      <img src={`https://i.pravatar.cc/100?img=${i+15}`} alt="User" className="w-full h-full object-cover" />
                   </div>
                 ))}
                 <div className="w-10 h-10 rounded-full border-2 border-[#161622] bg-[#4F46E5] flex items-center justify-center text-[11px] font-black text-white shadow-lg">
                    +2k
                 </div>
              </div>
              <div className="flex flex-col gap-1.5">
                 <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
                 </div>
                 <span className="text-[12px] font-bold text-white/50 leading-none">Loved by hostel managers globally</span>
              </div>
           </div>
        </motion.div>
      </motion.div>      {/* RIGHT PANEL (45%): Login Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-10 md:p-16 relative bg-[#FAFAFA]">
        {/* Subtle Decorative Accents */}
        <div className="absolute top-[-10%] right-[-5%] w-[350px] h-[350px] bg-[#4F46E5]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-[#7C3AED]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[2px] pointer-events-none md:hidden" />

        <div className="w-full max-w-[480px] relative z-10">
          {/* Mobile Header Visibility */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:hidden flex flex-col items-center gap-4 mb-10 text-center"
          >
             <Link href="/" className="flex items-center gap-3 group">
                <div className="w-11 h-11 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-[14px] flex items-center justify-center text-white shadow-xl shadow-indigo-500/10">
                   <Building2 size={22} strokeWidth={2.5} />
                </div>
                <span className="text-2xl font-black text-[#0F0F1A] tracking-tight font-sora">HostelHub</span>
             </Link>
             <p className="text-[10px] font-black text-[#4F46E5] tracking-[0.2em] uppercase px-5 py-2 bg-white border border-slate-100 rounded-full shadow-md">{tagline}</p>
          </motion.div>

          {/* Form Content Wrapper */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-white rounded-[32px] sm:rounded-[48px] shadow-[0_32px_120px_rgba(0,0,0,0.06)] p-7 sm:p-14 border border-slate-100"
          >
            {children}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-14 flex items-center justify-center gap-10 opacity-70"
          >
             <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300">
                <CheckCircle2 size={16} className="text-[#4F46E5]" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Enterprise Grade</span>
             </div>
             <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
             <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300">
                <span className="text-[16px]">🔐</span>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">256-bit AES</span>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
