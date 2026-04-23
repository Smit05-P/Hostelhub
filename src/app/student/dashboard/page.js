"use client";

import { useMemo, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Bed, Activity, MessageSquare, UserCheck,
  TrendingUp, ArrowUpRight, Plus, DollarSign, Bell,
  Clock, ArrowRight, Wallet, Calendar, ShieldCheck, Loader2, Sparkles,
  Zap, Heart, Target, Maximize2, Building2, CreditCard, ShieldAlert,
  MapPin, CheckCircle, AlertTriangle, UserCircle, RefreshCw
} from "lucide-react";
import dynamic from "next/dynamic";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { SkeletonCard, SkeletonHero, Shimmer } from "@/components/ui/Skeleton";

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
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

const StatCard = memo(function StatCard({ title, value, icon: Icon, trend, colorClass, subValue }) {
  return (
    <motion.div
      variants={ITEM_VARIANTS}
      whileHover={{ y: -5, scale: 1.02 }}
      className="premium-glass p-8 rounded-[2.5rem] border border-slate-200/60 relative overflow-hidden group shadow-xl transition-all duration-500 hover:shadow-indigo-500/10"
    >
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[50px] opacity-10 rounded-full transition-transform duration-700 group-hover:scale-150 ${colorClass}`} />
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 text-slate-900 border border-white/20 shadow-inner`}>
          <Icon size={20} className={colorClass.replace('bg-', 'text-').split(' ')[0]} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 italic">
            <TrendingUp size={10} strokeWidth={3} /> {trend}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic uppercase">{value}</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
            {title} {subValue && <span className="text-indigo-400 ml-1">· {subValue}</span>}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

const QuickAction = memo(function QuickAction({ label, href, icon: Icon, color }) {
  return (
    <motion.div variants={ITEM_VARIANTS}>
      <Link
        href={href}
        className="flex items-center gap-4 px-8 py-5 rounded-[2rem] bg-white border border-slate-200 hover:border-indigo-600/20 hover:bg-indigo-600/5 transition-all duration-500 group shadow-sm hover:shadow-xl hover:shadow-indigo-600/10"
      >
        <div className={`p-3 rounded-xl ${color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-inner border border-white/20`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest group-hover:text-indigo-600 transition-colors italic">{label}</span>
        <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all" />
      </Link>
    </motion.div>
  );
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function StudentDashboardPage() {
  const { user, hostelStatus, refreshUser } = useAuth();
  const { data, isLoading, error } = useStudentDashboard();
  
  const profile = data?.profile || null;
  const room = data?.room || null;
  const fees = data?.fees || [];
  const complaints = data?.complaints || [];
  const currentFee = data?.currentFee || null;
  const notices = data?.notices || [];
  
  const isApproved = hostelStatus === "APPROVED";
  const loading = isApproved && isLoading && !data;

  if (loading) {
    return (
      <div className="space-y-12 pb-24">
        <SkeletonHero />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="premium-glass p-12 rounded-[3.5rem] border border-slate-200/60 shadow-xl h-[400px]">
              <Shimmer className="w-1/3 h-8 rounded-full mb-8" />
              <div className="space-y-4">
                <Shimmer className="w-full h-24 rounded-2xl" />
                <Shimmer className="w-full h-24 rounded-2xl" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-10">
            <div className="premium-glass p-10 rounded-[3.5rem] border border-slate-200/60 shadow-xl h-[500px] flex flex-col items-center justify-center gap-10">
              <Shimmer className="w-40 h-40 rounded-full" />
              <Shimmer className="w-full h-20 rounded-[2rem]" />
              <Shimmer className="w-full h-20 rounded-[2rem]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-6 p-4">
         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 max-w-sm">
            <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto" />
            <p className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">System Error</p>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-tight italic">Failed to establish connection with the central hub.</p>
            <button onClick={() => refreshUser()} className="mt-4 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition w-full shadow-lg shadow-indigo-600/20 active:scale-95 italic">
              Reboot Connection
            </button>
         </motion.div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
         <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] shadow-3xl border border-white/5 text-center space-y-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative inline-block">
               <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto text-indigo-400 rotate-3 transition-transform hover:rotate-0 duration-500 backdrop-blur-xl">
                  <UserCircle size={64} strokeWidth={1.5} />
               </div>
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] -rotate-6"
               >
                  <Clock size={24} strokeWidth={2.5} />
               </motion.div>
            </div>
            
            <div className="space-y-4">
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                 Verification <br /><span className="text-indigo-500">Pending</span>
               </h2>
               <p className="text-sm text-slate-400 font-bold uppercase tracking-tight italic leading-relaxed opacity-70">
                 Your resident profile is currently under review by administration. Full terminal access will be granted upon clearance.
               </p>
            </div>

            <div className="flex flex-col gap-4 pt-4">
               <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => refreshUser()}
                className="w-full h-16 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 group italic"
               >
                 <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                 Refresh Status
               </motion.button>
               <Link href="/student/profile" className="w-full h-16 bg-white/5 text-slate-300 border border-white/10 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 italic">
                 Edit Identity
               </Link>
            </div>
         </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={CONTAINER_VARIANTS}
      className="space-y-12 pb-24"
    >
      {/* SaaS Platinum Hero */}
      <motion.section 
        variants={ITEM_VARIANTS}
        className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 lg:p-20 text-white shadow-3xl border border-white/5"
      >
        <div className="absolute top-0 right-0 w-[800px] h-full bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-4 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
              <Sparkles size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 italic">Security Clearance Active</span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-black tracking-tight leading-[0.85] italic">
              HELLO, <br /> <span className="text-indigo-500">{profile?.name?.split(" ")[0] || "RESIDENT"}</span>.
            </h1>
            <p className="text-lg text-slate-400 font-bold uppercase tracking-tight italic max-w-2xl leading-relaxed opacity-80">
              Stationed at <span className="text-white">{room ? `Unit ${room.roomNumber}` : 'Unassigned Node'}</span>. Spatial status <span className="text-indigo-400">{room ? 'Stabilized' : 'Awaiting Flow'}</span>. Lifecycle integrity <span className="text-white">{profile?.daysLeft || 0}D Remaining</span>.
            </p>
          </div>

          <div className="flex flex-col items-end gap-6 shrink-0">
            <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-end gap-2 shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Temporal Sync</span>
              <p className="text-4xl font-black text-white italic tracking-tighter">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping shadow-[0_0_15px_rgba(99,102,241,1)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Live Feed</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Assigned Unit" 
          value={room ? room.roomNumber : "PENDING"} 
          icon={Bed} 
          trend={room ? "Active" : null} 
          colorClass="bg-indigo-600" 
          subValue={room ? `Block A` : null}
        />
        <StatCard 
          title="Ledger Status" 
          value={currentFee ? currentFee.status : "CLEAR"} 
          icon={Wallet} 
          trend={currentFee?.status === 'Paid' ? "Verified" : null} 
          colorClass="bg-indigo-600" 
          subValue={currentFee ? `${MONTHS[(currentFee.month||1)-1]}` : null}
        />
        <StatCard 
          title="Spatial Load" 
          value={room ? `${room.capacity} PAX` : "-"} 
          icon={Users} 
          trend="Capacity" 
          colorClass="bg-slate-900" 
        />
        <StatCard 
          title="Cycle Integrity" 
          value={profile?.daysLeft !== null ? `${profile.daysLeft}D` : "-"} 
          icon={Clock} 
          trend="Remaining" 
          colorClass="bg-indigo-400" 
        />
      </div>

      {/* Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Broadcast & Logs */}
        <div className="lg:col-span-8 space-y-10">
          
          <motion.div variants={ITEM_VARIANTS} className="premium-glass p-12 rounded-[3.5rem] relative overflow-hidden group border border-slate-200/60 shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[120px] rounded-full -z-10" />
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Notice Propagation</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                  <Bell size={14} className="text-indigo-500" /> Active Broadcasts · Local Node
                </p>
              </div>
              <Link href="/student/notices" className="premium-glass px-8 py-4 rounded-[1.5rem] text-[11px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-500 border border-slate-200 italic shadow-sm">
                View Archive
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {notices.length === 0 ? (
                <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center opacity-40">
                  <ZapOff size={64} className="text-slate-300 mb-6" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">No active streams detected.</p>
                </div>
              ) : (
                notices.map((notice, idx) => (
                  <motion.div
                    key={notice._id || idx}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="p-8 rounded-[2.5rem] bg-white border border-slate-100 relative group transition-all duration-500 hover:shadow-2xl hover:border-indigo-100 flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest italic">
                        {new Date(notice.date || notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      {idx === 0 && (
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]"></span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-4 line-clamp-2 tracking-tighter uppercase italic leading-tight">{notice.title}</h4>
                    <p className="text-[11px] font-bold text-slate-400 line-clamp-3 leading-relaxed mb-8 uppercase tracking-tight flex-1 italic opacity-80">
                      {notice.description}
                    </p>
                    <Link href="/student/notices" className="text-[10px] font-black text-indigo-600 flex items-center gap-2 uppercase tracking-[0.3em] group-hover:gap-4 transition-all w-fit italic">
                      SYNC LOG <ArrowRight size={14} strokeWidth={3} />
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Ledger Logs */}
            <motion.div variants={ITEM_VARIANTS} className="premium-glass p-10 rounded-[3.5rem] relative overflow-hidden border border-slate-200/60 shadow-xl">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Financial Ledger</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Recent Transactions</p>
                  </div>
                  <Link href="/student/payments" className="p-3 rounded-xl bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-500 border border-slate-100">
                    <ArrowUpRight size={18} />
                  </Link>
               </div>

               <div className="space-y-4">
                  {fees.length === 0 ? (
                    <div className="py-12 text-center text-slate-200 opacity-40">
                      <DollarSign size={40} className="mx-auto mb-4" />
                      <p className="text-[9px] font-black uppercase tracking-widest italic">No Records Found</p>
                    </div>
                  ) : (
                    fees.slice(0, 3).map((fee) => (
                      <div key={fee._id} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white border border-slate-50 hover:border-indigo-100 hover:shadow-lg transition-all duration-500 group">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${fee.status?.toLowerCase() === 'paid' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                              {fee.status?.toLowerCase() === 'paid' ? <CheckCircle size={18} strokeWidth={2.5} /> : <Clock size={18} strokeWidth={2.5} />}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tighter italic leading-none">{MONTHS[(fee.month||1)-1]} {fee.year}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">${fee.amount?.toLocaleString()}</p>
                           </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] italic ${fee.status?.toLowerCase() === 'paid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-white'}`}>
                          {fee.status}
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </motion.div>

            {/* Support Tickets */}
            <motion.div variants={ITEM_VARIANTS} className="premium-glass p-10 rounded-[3.5rem] relative overflow-hidden border border-slate-200/60 shadow-xl">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Support Matrix</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Active Protocols</p>
                  </div>
                  <Link href="/student/complaints" className="p-3 rounded-xl bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-500 border border-slate-100">
                    <MessageSquare size={18} />
                  </Link>
               </div>

               <div className="space-y-4">
                  {complaints.length === 0 ? (
                    <div className="py-12 text-center text-slate-200 opacity-40">
                      <ShieldAlert size={40} className="mx-auto mb-4" />
                      <p className="text-[9px] font-black uppercase tracking-widest italic">No Active Reports</p>
                    </div>
                  ) : (
                    complaints.slice(0, 3).map((c) => (
                      <div key={c._id} className="flex flex-col p-5 rounded-[1.5rem] bg-white border border-slate-50 hover:border-indigo-100 hover:shadow-lg transition-all duration-500 gap-3 group">
                        <div className="flex items-start justify-between gap-4">
                           <p className="text-sm font-black text-slate-900 tracking-tighter uppercase italic line-clamp-1 flex-1">{c.subject}</p>
                           <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 shadow-[0_0_10px_rgba(0,0,0,0.1)] ${c.status === 'Resolved' ? 'bg-indigo-600' : 'bg-amber-500 animate-pulse'}`} />
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                           <span className={`text-[8px] font-black uppercase tracking-widest italic ${c.status === 'Resolved' ? 'text-indigo-600' : 'text-amber-600'}`}>
                             {c.status}
                           </span>
                           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">
                             {new Date(c.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                           </span>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </motion.div>
          </div>
        </div>

        {/* Right: Actions & Identity */}
        <div className="lg:col-span-4 space-y-10">
          
          <motion.div variants={ITEM_VARIANTS} className="premium-glass p-10 rounded-[3.5rem] flex flex-col items-center border border-slate-200/60 shadow-xl text-center overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mb-10 italic">Spatial Mapping</h3>
            
            <div className="relative group w-full max-w-[180px] aspect-square mx-auto my-4">
              <div className="absolute inset-0 bg-indigo-600/5 blur-[60px] rounded-full scale-90 group-hover:scale-110 transition-transform duration-700" />
              <div className="w-full h-full rounded-[3rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 shadow-inner relative z-10">
                <MapPin size={40} strokeWidth={2.5} className="text-indigo-600" />
                <div className="text-center">
                  <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{room ? room.roomNumber : '---'}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Unit Assignment</p>
                </div>
              </div>
            </div>

            <div className="w-full mt-10 space-y-4">
              <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-600/10 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,1)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Rent Value</span>
                </div>
                <span className="relative z-10 text-2xl font-black italic">${profile?.rentAmount || room?.rent || 0}</span>
              </div>
              <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Node status</span>
                </div>
                <span className="text-[11px] font-black text-emerald-600 italic uppercase tracking-widest">Active Link</span>
              </div>
            </div>
            <Link href="/student/profile" className="mt-10 w-full py-5 rounded-[2rem] bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 italic">
              ACCESS IDENTITY <UserCheck size={14} className="fill-white" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 gap-6">
            <QuickAction label="Settle Ledger" href="/student/payments" icon={CreditCard} color="bg-indigo-600/10 text-indigo-700" />
            <QuickAction label="Broadcast Archive" href="/student/notices" icon={Bell} color="bg-slate-900/10 text-slate-900" />
            <QuickAction label="Report Incident" href="/student/complaints" icon={ShieldAlert} color="bg-indigo-600/10 text-indigo-600" />
            <QuickAction label="Visitor Protocol" href="/student/visitors" icon={Plus} color="bg-indigo-400/10 text-indigo-400" />
          </div>

          <motion.div variants={ITEM_VARIANTS} className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-3xl border border-white/5">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full animate-pulse" />
            <ShieldCheck size={56} strokeWidth={2.5} className="text-indigo-500 mb-8 group-hover:scale-110 transition-transform duration-700" />
            <h4 className="text-3xl font-black mb-4 tracking-tighter italic uppercase">Security Core</h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 font-bold italic uppercase tracking-tighter opacity-70">
              Active node protection. Firestore security protocols governing all <span className="text-white">HostelHub</span> stream integrity.
            </p>
            <div className="flex items-center justify-between px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl transition-all group-hover:bg-white/10">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping shadow-[0_0_15px_rgba(99,102,241,1)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 italic">INTEGRITY OK</span>
              </div>
              <Maximize2 size={16} className="text-slate-500 group-hover:text-white transition-colors" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}



