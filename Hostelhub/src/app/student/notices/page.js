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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-[8px] border-slate-900/10 border-t-indigo-600 rounded-full" 
          />
          <Megaphone className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={28} />
        </div>
        <p className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-400 italic">Syncing Central Intelligence...</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-12 bg-slate-900 rounded-[3.5rem] p-10 sm:p-16 text-white relative overflow-hidden group shadow-3xl border border-white/5">
           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />
           <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full pointer-events-none" />
           
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
              <div className="space-y-6 flex-1">
                 <div className="flex items-center gap-4">
                    <div className="p-4 rounded-[1.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-500">
                       <Bell size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                       <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] italic leading-none">Newsfeed Terminal</span>
                       <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter mt-3 uppercase leading-none">
                          Command Board
                       </h1>
                    </div>
                 </div>
                 <p className="text-slate-400 font-bold uppercase text-xs sm:text-sm tracking-[0.2em] max-w-2xl italic leading-relaxed">
                   Synchronized intelligence regarding facility upgrades, administrative updates, and institutional alerts.
                 </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                 <div className="premium-glass p-2 rounded-[2rem] border border-white/10 w-full sm:w-auto">
                    <div className="flex bg-white/5 rounded-[1.5rem] p-1">
                       {['all', 'important', 'normal'].map(p => (
                         <button 
                           key={p} onClick={() => setFilterPriority(p)}
                           className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                             filterPriority === p 
                               ? 'bg-indigo-600 text-white shadow-xl' 
                               : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                           }`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Search Overlay */}
           <div className="relative mt-12 group/search">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/search:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Query Intelligence Modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-18 pr-8 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm font-black text-white italic uppercase tracking-[0.2em] focus:bg-white/10 transition-all outline-none focus:border-indigo-500/50"
              />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/search:opacity-100 transition-opacity">
                 <Sparkles className="text-indigo-400 animate-pulse" size={20} />
              </div>
           </div>
        </motion.div>
      </div>

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
                   key={notice.id}
                   layout
                   variants={ITEM_VARIANTS}
                   className={`group bg-white p-10 sm:p-12 rounded-[3.5rem] shadow-xl border-t-8 transition-all hover:shadow-3xl hover:-translate-y-2 relative flex flex-col h-full overflow-hidden ${
                     notice.priority === 'important'
                     ? 'border-rose-500 shadow-rose-100/20'
                     : 'border-indigo-600 shadow-indigo-100/20'
                   }`}
                 >
                   <div className="absolute -right-8 -top-8 w-32 h-32 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                   
                   <div className="flex items-center justify-between mb-8">
                      <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center gap-2 shadow-sm ${
                        notice.priority === 'important'
                        ? 'bg-rose-500 text-white border border-rose-400'
                        : 'bg-indigo-600 text-white border border-indigo-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-white ${notice.priority === 'important' ? 'animate-pulse' : ''}`} />
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
