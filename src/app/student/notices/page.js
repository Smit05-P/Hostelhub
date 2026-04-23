"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Bell, Search, Calendar, AlertTriangle, 
  CheckCircle2, TrendingUp, Filter, ArrowUpRight,
  ShieldCheck, Zap, Sparkles, MessageSquare, Plus,
  Database, Info, Clock, Pin, Megaphone
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useNotices } from "@/hooks/useNotices";

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const ITEM_VARIANTS = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 350, damping: 25 }
  }
};

import { SkeletonHero, SkeletonCard, Shimmer } from "@/components/ui/Skeleton";

export default function StudentNoticesPage() {
  const { userData } = useAuth();
  const { data: notices = [], isLoading: loading } = useNotices();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");

  const filteredNotices = useMemo(() => {
    let result = (notices || []).filter(n =>
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filterPriority !== "all") result = result.filter(n => n.priority === filterPriority);
    return result;
  }, [notices, searchQuery, filterPriority]);

  if (loading && notices.length === 0) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen pb-32 space-y-12 sm:space-y-16">
        <SkeletonHero />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
           {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl space-y-8">
                <div className="flex justify-between items-center">
                   <Shimmer className="w-24 h-8 rounded-xl" />
                   <Shimmer className="w-32 h-6 rounded-lg" />
                </div>
                <div className="space-y-4">
                   <Shimmer className="w-3/4 h-10 rounded-2xl" />
                   <Shimmer className="w-full h-24 rounded-3xl" />
                </div>
                <div className="flex justify-between items-center pt-8 border-t border-slate-50">
                   <div className="flex gap-4">
                      <Shimmer className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2">
                         <Shimmer className="w-16 h-4 rounded-lg" />
                         <Shimmer className="w-24 h-4 rounded-lg" />
                      </div>
                   </div>
                   <Shimmer className="w-12 h-12 rounded-2xl" />
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={CONTAINER_VARIANTS}
      className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen pb-32 space-y-12 sm:space-y-16"
    >
      
      {/* Dynamic Header Node */}
      <motion.div variants={ITEM_VARIANTS} className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3.5rem] p-7 sm:p-12 lg:p-16 text-white relative overflow-hidden shadow-2xl border border-white/5">
         <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-500/10 blur-[100px] sm:blur-[120px] rounded-full animate-pulse pointer-events-none" />
         <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-600/5 blur-[60px] rounded-full pointer-events-none" />
         
         <div className="relative z-10 space-y-6 sm:space-y-8">
            {/* Title Row */}
            <div className="flex items-center gap-4">
               <div className="p-3 sm:p-4 rounded-[1.2rem] sm:rounded-[1.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 shrink-0">
                  <Bell size={22} strokeWidth={2.5} className="sm:w-8 sm:h-8" />
               </div>
               <div className="min-w-0">
                  <span className="text-[9px] sm:text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none block mb-1">Newsfeed Terminal</span>
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none">
                     Command Board
                  </h1>
               </div>
            </div>

            <p className="text-slate-400 font-bold uppercase text-[10px] sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] max-w-2xl leading-relaxed">
              Synchronized intelligence regarding facility upgrades, administrative updates, and institutional alerts.
            </p>

            {/* Filter Tabs — scrollable on mobile */}
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
               <div className="flex items-center gap-1.5 bg-white/5 rounded-[1.5rem] p-1 w-max min-w-full sm:w-auto">
                  {['all', 'high', 'medium'].map(p => (
                    <button 
                      key={p} onClick={() => setFilterPriority(p)}
                      className={`px-5 py-2.5 sm:px-8 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                        filterPriority === p 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'text-white/50 hover:text-white/90 hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
               </div>
            </div>

            {/* Search */}
            <div className="relative group/search">
               <Search className="absolute left-5 sm:left-8 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/20 group-focus-within/search:text-indigo-400 transition-colors" />
               <input
                 type="text"
                 placeholder="Query Intell..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-12 sm:pl-18 pr-6 sm:pr-8 py-4 sm:py-6 bg-white/5 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] text-sm font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.2em] focus:bg-white/10 transition-all outline-none focus:border-indigo-500/50"
               />
            </div>
         </div>
      </motion.div>

      {/* Notices Stream */}
      <div className="space-y-8">
         <AnimatePresence mode="popLayout">
           {filteredNotices.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[4rem] border border-slate-200 border-dashed py-32 sm:py-48 text-center px-10 relative overflow-hidden group"
             >
                <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="inline-flex w-32 h-32 rounded-[3rem] bg-slate-100 items-center justify-center text-slate-300 mb-10 border border-slate-200 group-hover:rotate-12 transition-transform duration-700">
                   <CheckCircle2 size={64} strokeWidth={1} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase relative z-10">Intelligence Clear</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 italic px-4 max-w-sm mx-auto leading-relaxed relative z-10">
                   Your command module is up to date. No high-priority transmissions pending for your sector.
                </p>
             </motion.div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                {filteredNotices.map((notice) => (
                 <motion.div 
                   key={notice._id}
                   layout
                   variants={ITEM_VARIANTS}
                   className={`group bg-white p-10 sm:p-12 rounded-[3.5rem] shadow-xl border-t-8 transition-all hover:shadow-3xl hover:-translate-y-2 relative flex flex-col h-full overflow-hidden ${
                     notice.priority === 'high'
                     ? 'border-rose-500 shadow-rose-100/20'
                     : 'border-indigo-600 shadow-indigo-100/20'
                   }`}
                 >
                   <div className="absolute -right-8 -top-8 w-32 h-32 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                   
                   <div className="flex items-center justify-between mb-8">
                      <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2 shadow-sm ${
                        notice.priority === 'high'
                        ? 'bg-rose-500 text-white border border-rose-400'
                        : 'bg-indigo-600 text-white border border-indigo-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-white ${notice.priority === 'high' ? 'animate-pulse' : ''}`} />
                        {notice.priority}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                         <Clock size={16} />
                         <span className="text-[11px] font-black italic tracking-widest tabular-nums uppercase">
                            {new Date(notice.date || notice.createdAt).toLocaleDateString()}
                         </span>
                      </div>
                   </div>

                   <div className="flex-1 space-y-6">
                      <h4 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-none italic uppercase tracking-tighter">
                        {notice.title}
                      </h4>
                      <p className="text-slate-500 leading-relaxed font-bold uppercase text-[11px] sm:text-xs whitespace-pre-wrap opacity-80 group-hover:opacity-100 transition-opacity italic">
                        {notice.description}
                      </p>
                   </div>

                   <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between group-hover:border-indigo-100 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black italic shadow-2xl">HM</div>
                         <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Source</p>
                            <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-tight mt-1.5">Administration</p>
                         </div>
                      </div>
                      <motion.div 
                        whileHover={{ x: 5, y: -5 }}
                        className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"
                      >
                         <ArrowUpRight size={20} strokeWidth={3} />
                      </motion.div>
                   </div>

                   {/* Background Graphics */}
                   <div className="absolute -bottom-8 -right-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                      <Info size={120} strokeWidth={0.5} />
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
         </AnimatePresence>
      </div>

      {/* System Integrity Badge */}
      <motion.div variants={ITEM_VARIANTS} className="flex justify-center pt-8">
         <div className="inline-flex items-center gap-4 px-10 py-5 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all cursor-crosshair group">
            <ShieldCheck className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <div className="text-left">
               <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Encrypted Feed Lock</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase italic mt-1 leading-none tracking-widest">Real-time synchronization active for all channels</p>
            </div>
         </div>
      </motion.div>
    </motion.div>
  );
}
