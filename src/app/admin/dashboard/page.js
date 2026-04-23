"use client";

import { useMemo, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Bed, Activity, MessageSquare, UserCheck,
  TrendingUp, ArrowUpRight, Plus, DollarSign, Bell,
  Clock, ArrowRight, Wallet, Calendar, ShieldCheck, Loader2, Sparkles,
  Zap, Heart, Target, Maximize2
} from "lucide-react";
import dynamic from "next/dynamic";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRooms } from "@/hooks/useRooms";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
const DonutChartContent = memo(function DonutChartContent({ percent, size = 160, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative group w-full max-w-[200px] aspect-square mx-auto my-2">
      <div className="absolute inset-0 bg-indigo-600/5 blur-[60px] rounded-full scale-90 group-hover:scale-110 transition-transform duration-700" />
      <svg className="transform -rotate-90 relative z-10 w-full h-full p-2" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="transparent" />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "circOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4F46E5"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center relative z-10">
        <span className="text-4xl font-black text-slate-900 leading-none tracking-tighter italic">{percent}%</span>
        <span className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-[0.3em] italic">Load Factor</span>
      </div>
    </div>
  );
});

const DonutChart = dynamic(() => Promise.resolve(DonutChartContent), { ssr: false });

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

const StatCard = memo(function StatCard({ title, value, icon: Icon, trend, colorClass }) {
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
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 italic">
          <TrendingUp size={10} strokeWidth={3} /> {trend}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-slate-900 tracking-tighter mb-2 italic">{value}</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{title}</p>
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

import { SkeletonCard, SkeletonHero, Shimmer } from "@/components/ui/Skeleton";

export default function AdminDashboardPage() {
  const defaultStats = {
    totalStudents: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalRevenue: 0,
    pendingComplaints: 0,
    occupancyPct: 0,
    upcomingVacancies: 0,
    chartData: [],
  };
  const { data: dashboardData, isLoading: statsLoading } = useDashboardStats();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();

  const stats = dashboardData || defaultStats;
  const chartData = useMemo(() => stats.chartData || [], [stats.chartData]);
  const visibleRooms = useMemo(() => rooms.slice(0, 8), [rooms]);
  const loading = statsLoading || roomsLoading;

  const maxRevenue = useMemo(() =>
    Math.max(...chartData.map(m => (m.collected || 0) + (m.pending || 0)), 1), [chartData]
  );

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
              <div className="flex items-end justify-between h-[200px] gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Shimmer key={i} className="flex-1 rounded-2xl" style={{ height: `${20 + Math.random() * 60}%` }} />
                ))}
              </div>
            </div>
            <div className="premium-glass p-12 rounded-[3.5rem] border border-slate-200/60 shadow-xl">
               <Shimmer className="w-1/4 h-8 rounded-full mb-12" />
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {Array.from({ length: 4 }).map((_, i) => (
                   <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6">
                     <Shimmer className="w-full h-4 rounded-full" />
                     <Shimmer className="w-full h-12 rounded-xl" />
                     <Shimmer className="w-1/2 h-3 rounded-full" />
                   </div>
                 ))}
               </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-10">
            <div className="premium-glass p-10 rounded-[3.5rem] border border-slate-200/60 shadow-xl h-[500px] flex flex-col items-center justify-center gap-10">
              <Shimmer className="w-40 h-40 rounded-full" />
              <Shimmer className="w-full h-20 rounded-[2rem]" />
              <Shimmer className="w-full h-20 rounded-[2rem]" />
              <Shimmer className="w-full h-16 rounded-[2rem]" />
            </div>
          </div>
        </div>
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
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300 italic">Institutional Core Active</span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-black tracking-tight leading-[0.85] italic">
              COMMAND <br /> <span className="text-indigo-500">CENTRAL</span>.
            </h1>
            <p className="text-lg text-slate-400 font-bold uppercase tracking-tight italic max-w-2xl leading-relaxed opacity-80">
              Overseeing <span className="text-white">{stats.totalStudents} units</span> across <span className="text-white">{stats.totalRooms} spatial nodes</span>. Efficiency currently mapped at <span className="text-indigo-400">{stats.occupancyPct}% peak</span>.
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
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Real-time Stream</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Resident Mass" value={stats.totalStudents} icon={Users} trend="+8.4% Flow" colorClass="bg-indigo-600" />
        <StatCard title="Yield Velocity" value={`$${(stats.totalRevenue / 1000).toFixed(1)}k`} icon={Wallet} trend="Optimized" colorClass="bg-indigo-600" />
        <StatCard title="Spatial Nodes" value={stats.totalRooms} icon={Bed} trend="Stabilized" colorClass="bg-slate-900" />
        <StatCard title="Lifecycle Pulse" value={stats.upcomingVacancies} icon={Clock} trend="30D Window" colorClass="bg-indigo-400" />
      </div>

      {/* Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Financial & Occupancy */}
        <div className="lg:col-span-8 space-y-10">
          
          <motion.div variants={ITEM_VARIANTS} className="premium-glass p-12 rounded-[3.5rem] relative overflow-hidden group border border-slate-200/60 shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 blur-[120px] rounded-full -z-10" />
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Ledger Projection</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic flex items-center gap-2">
                  <Target size={14} className="text-indigo-500" /> Performance · 6 Cycle Range
                </p>
              </div>
              <Link href="/admin/fees" className="premium-glass px-8 py-4 rounded-[1.5rem] text-[11px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-500 border border-slate-200 italic shadow-sm">
                Audit Core
              </Link>
            </div>

            {chartData.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-slate-300 gap-6 opacity-40">
                <DollarSign size={64} className="animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-[0.4em] italic">Awaiting Financial Streams...</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-hide pt-12">
                <div className="flex items-end justify-between h-[320px] gap-8 min-w-[500px]">
                  {chartData.map((data, i) => {
                    const total = (data.collected || 0) + (data.pending || 0);
                    const isLast = i === chartData.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-8 group">
                        <div className="relative w-full flex flex-col justify-end h-full max-w-[60px]">
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="absolute -top-16 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 transition-all z-20 shadow-2xl border border-slate-800 italic"
                          >
                            ${(data.collected / 1000).toFixed(1)}k
                          </motion.div>

                          <div className={`w-full rounded-[2rem] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] relative overflow-hidden group-hover:shadow-2xl group-hover:shadow-indigo-600/30 ${isLast ? 'bg-indigo-50 shadow-inner' : 'bg-slate-50 shadow-inner'}`}
                            style={{ height: `${total > 0 ? (total / maxRevenue) * 100 : 8}%` }}>
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${total > 0 ? ((data.collected || 0) / total) * 100 : 0}%` }}
                              transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                              className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ${isLast ? 'bg-indigo-600' : 'bg-slate-900'}`} 
                            />
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-500 italic ${isLast ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div variants={ITEM_VARIANTS} className="premium-glass p-12 rounded-[3.5rem] relative overflow-hidden border border-slate-200/60 shadow-xl">
             <div className="flex items-center justify-between mb-12">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Unit Integrity</h3>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic">Real-time Spatial Distribution</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.5)]" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Active</span></div>
                  <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-900" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Locked</span></div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {visibleRooms.map((room) => {
                 const occupied = room.occupants?.length || 0;
                 const isFull = occupied >= (room.capacity || 1);
                 return (
                   <div key={room._id} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-indigo-600/20 transition-all duration-500 group shadow-sm hover:shadow-2xl">
                     <div className="flex items-center justify-between mb-8">
                       <span className="text-xs font-black text-slate-900 italic tracking-tighter uppercase">Unit {room.roomNumber}</span>
                       <Activity size={16} className={isFull ? 'text-slate-900' : 'text-indigo-600 animate-pulse'} />
                     </div>
                     <div className="flex items-end gap-1.5 h-12">
                       {Array.from({ length: room.capacity || 1 }).map((_, bIdx) => (
                         <div key={bIdx} className={`flex-1 h-full rounded-xl transition-all duration-700 ${bIdx < occupied ? 'bg-slate-900' : 'bg-slate-50 group-hover:bg-indigo-50'}`} />
                       ))}
                     </div>
                     <div className="flex items-center justify-between mt-6">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{occupied}/{room.capacity} LOADED</p>
                       {isFull && <div className="text-[8px] font-black px-2 py-1 bg-slate-900 text-white rounded-lg uppercase tracking-tighter italic shadow-lg">PEAK</div>}
                     </div>
                   </div>
                 );
               })}
             </div>
          </motion.div>
        </div>

        {/* Right: Actions & Integrity */}
        <div className="lg:col-span-4 space-y-10">
          
          <motion.div variants={ITEM_VARIANTS} className="premium-glass p-10 rounded-[3.5rem] flex flex-col items-center border border-slate-200/60 shadow-xl text-center overflow-hidden">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mb-10 italic">Spectral Capacity</h3>
            <DonutChart percent={stats.occupancyPct} />
            <div className="w-full mt-12 space-y-4">
              <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-600/10 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full" />
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,1)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Allocated</span>
                </div>
                <span className="relative z-10 text-2xl font-black italic">{stats.occupiedRooms} Units</span>
              </div>
              <div className="flex items-center justify-between p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Reserved</span>
                </div>
                <span className="text-2xl font-black text-slate-900 italic">{stats.availableRooms} Units</span>
              </div>
            </div>
            <Link href="/admin/allocation" className="mt-10 w-full py-5 rounded-[2rem] bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/30 italic">
              SYNC ACCESS <Zap size={14} className="fill-white" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 gap-6">
            <QuickAction label="Initialize Unit" href="/admin/rooms" icon={Plus} color="bg-indigo-600/10 text-indigo-700" />
            <QuickAction label="Resident Link" href="/admin/allocation" icon={UserCheck} color="bg-slate-900/10 text-slate-900" />
            <QuickAction label="Notice Propagation" href="/admin/notices" icon={Bell} color="bg-indigo-600/10 text-indigo-600" />
            <QuickAction label="Yield Ledger" href="/admin/fees" icon={DollarSign} color="bg-indigo-400/10 text-indigo-400" />
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





