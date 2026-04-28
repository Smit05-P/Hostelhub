"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, Search, Filter, DollarSign, CreditCard, 
  TrendingUp, AlertCircle, CheckCircle2, Download, 
  Plus, Calendar, ArrowRight, Wallet, History,
  Database, ShieldCheck, Zap, Sparkles, Target, BarChart3
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import Avatar from "@/components/ui/Avatar";

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
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

import { SkeletonHero, Shimmer } from "@/components/ui/Skeleton";

export default function AdminFeesPage() {
  const { addToast } = useToast();
  const { activeHostelId } = useAuth();
  
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0, monthRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [auditLoadingId, setAuditLoadingId] = useState(null);

  const fetchFeesData = async () => {
    if (!activeHostelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/fees", { params: { hostelId: activeHostelId } });
      setPayments(res.data.payments || []);
      setStats(res.data.stats || { totalCollected: 0, totalPending: 0, monthRevenue: 0 });
    } catch (err) {
      addToast("Failed to sync financial ledger.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeesData(); }, [activeHostelId]);

  const handleAudit = async (feeId) => {
    if (!activeHostelId) {
      addToast("Hostel context missing. Please refresh.", "error");
      return;
    }
    setAuditLoadingId(feeId);
    try {
      const { data } = await axios.get("/api/hostels/audit", {
        params: { hostelId: activeHostelId }
      });
      addToast(
        `System integrity check complete. Protocols synchronized.`,
        "success"
      );
      fetchFeesData();
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Audit failed";
      addToast(message, "error");
    } finally {
      setAuditLoadingId(null);
    }
  };

  const exportCSV = () => {
    const headers = ["Resident", "Email", "Date", "Amount", "Status", "Reference"];
    const csvRows = filteredPayments.map(p => [
      p.studentName,
      p.email,
      new Date(p.date || Date.now()).toLocaleDateString(),
      p.amount,
      p.status,
      p.id
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    const dateStr = new Date().toISOString().split("T")[0];
    const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HostelHub_Ledger_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = p.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status?.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  if (loading && payments.length === 0) {
    return (
      <div className="space-y-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-5 bg-slate-100 rounded-[3rem] h-[320px] p-10 space-y-8 overflow-hidden">
              <Shimmer className="w-1/3 h-10 rounded-2xl" />
              <Shimmer className="w-2/3 h-20 rounded-3xl" />
           </div>
           <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm space-y-6">
                   <Shimmer className="w-12 h-12 rounded-2xl" />
                   <Shimmer className="w-full h-8 rounded-full" />
                </div>
              ))}
           </div>
        </div>
        <div className="bg-white rounded-[3rem] sm:rounded-[4.5rem] border border-slate-200 shadow-2xl p-10 space-y-8">
           <Shimmer className="w-full h-16 rounded-3xl" />
           {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="flex items-center gap-6 py-4 border-b border-slate-50">
                <Shimmer className="w-16 h-16 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Shimmer className="w-1/3 h-5 rounded-lg" />
                  <Shimmer className="w-1/4 h-3 rounded-lg" />
                </div>
                <Shimmer className="w-24 h-10 rounded-2xl" />
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
      className="space-y-12 pb-24"
    >
      {/* SaaS Platinum Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <motion.div variants={ITEM_VARIANTS} className="lg:col-span-5 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-3xl border border-white/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/10 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center gap-4 mb-10">
                  <div className="p-4 rounded-[1.5rem] bg-emerald-600 text-white shadow-xl shadow-emerald-500/20">
                     <Wallet size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                     <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] italic leading-none">Yield Velocity</span>
                     <h2 className="text-2xl font-black italic tracking-tighter mt-2 uppercase">TOTAL REVENUE</h2>
                  </div>
               </div>
               <div className="mt-auto">
                  <h3 className="text-6xl font-black tracking-tighter italic">${(stats.totalCollected || 0).toLocaleString()}</h3>
                  <div className="flex items-center gap-3 mt-6">
                     <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping shadow-[0_0_15px_rgba(16,185,129,1)]" />
                     <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500 italic">Legitimately Cleared</span>
                  </div>
               </div>
            </div>
         </motion.div>

         <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { label: "Temporal Dissonance (Pending)", value: `$${(stats.totalPending || 0).toLocaleString()}`, icon: AlertCircle, color: "bg-rose-600" },
              { label: "Current Cycle Target", value: `$${(stats.monthRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "bg-indigo-600" },
              { label: "Institutional Invoices", value: payments.length, icon: History, color: "bg-slate-900" },
              { label: "Active Revenue Nodes", value: payments.filter(p => p.status?.toLowerCase() === 'paid').length, icon: BarChart3, color: "bg-emerald-600" }
            ].map((stat, i) => (
              <motion.div key={i} variants={ITEM_VARIANTS} className="premium-glass p-8 rounded-[2.5rem] border border-slate-200/60 flex flex-col justify-between hover:shadow-2xl transition-all shadow-sm group bg-white shadow-xl">
                 <div className={`w-12 h-12 rounded-2xl ${stat.color} bg-opacity-10 flex items-center justify-center text-slate-900 border border-white/20 shadow-inner italic transition-transform group-hover:scale-110`}>
                    <stat.icon size={20} className={stat.color.replace('bg-', 'text-')} />
                  </div>
                 <div className="mt-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter mt-2">{stat.value}</p>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-xl">
         <div className="relative group flex-1">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search Ledger Entry ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-4 bg-transparent border-none focus:ring-0 text-[12px] font-black uppercase tracking-widest text-slate-700 placeholder:text-slate-300 italic"
            />
         </div>
         <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
         <select 
           value={statusFilter}
           onChange={(e) => setStatusFilter(e.target.value)}
           className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase tracking-widest text-slate-600 cursor-pointer appearance-none px-10 italic"
         >
           <option value="all">EVERY STATE</option>
           <option value="paid">CLEARED UNITS</option>
           <option value="pending">AWAITING SYNC</option>
           <option value="overdue">OVERDUE BREACH</option>
         </select>
         <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
         <button 
           onClick={exportCSV}
           className="flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all italic shadow-2xl shadow-emerald-500/10"
         >
            EXPORT LEDGER <Download size={16} />
         </button>
      </div>

      {/* Table Section (Desktop) / Card Stack (Mobile) */}
      <div className="bg-white rounded-[3rem] sm:rounded-[4.5rem] border border-slate-200 shadow-2xl overflow-hidden p-2 sm:p-3">
         {/* Desktop Table View */}
         <div className="hidden lg:block overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[1100px]">
               <thead>
                  <tr className="bg-slate-50/50">
                     {[
                       "Resident Identity", "Temporal Root", "Yield Value", "Sync Status", "Reference ID", "Network Protocol"
                     ].map((h, i) => (
                       <th key={i} className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">{h}</th>
                     ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {filteredPayments.length === 0 ? (
                      <tr>
                         <td colSpan={6} className="py-48 text-center opacity-20">
                            <Database size={80} className="mx-auto mb-8 text-slate-400" />
                            <p className="font-black uppercase tracking-[0.5em] text-[14px] text-slate-400 italic">No Synchronization Markers Match Filters</p>
                         </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p, i) => (
                        <motion.tr 
                          key={p.id || i} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                          transition={{ delay: i * 0.02, duration: 0.3 }}
                          className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                        >
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-5">
                                 <Avatar src={p.profileImage} name={p.studentName} size={12} className="shadow-xl shadow-indigo-500/10" />
                                 <div className="flex flex-col">
                                    <p className="text-base font-black text-slate-900 uppercase tracking-tight italic group-hover:text-indigo-600 transition-colors">{p.studentName}</p>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-1.5">{p.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-3">
                                 <Calendar size={14} className="text-slate-300" />
                                 <span className="text-[12px] font-black text-slate-600 uppercase italic tabular-nums leading-none">
                                    {new Date(p.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                 </span>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-2xl font-black text-slate-900 italic tracking-tighter tabular-nums">${(p.amount || 0).toLocaleString()}</span>
                           </td>
                           <td className="px-10 py-8">
                              <PaymentStatusBadge status={p.status} />
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[11px] font-black text-slate-300 font-mono italic leading-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 group-hover:bg-white group-hover:text-slate-600 transition-all">{p.id?.toString().slice(-12) || 'REF-UNSET-0X'}</span>
                           </td>
                           <td className="px-10 py-8">
                               <button
                                 onClick={() => handleAudit(p.id)}
                                 disabled={auditLoadingId === p.id}
                                 className="flex items-center gap-3 px-6 py-3 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest italic border border-slate-100 hover:border-emerald-500 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed group"
                               >
                                  {auditLoadingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} className="group-hover:animate-pulse" />}
                                  {auditLoadingId === p.id ? "SYNCING..." : "INTEGRITY CHECK"}
                               </button>
                            </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
               </tbody>
            </table>
         </div>

         {/* Mobile Card Stack View */}
         <div className="lg:hidden space-y-4 p-2 sm:p-4">
            <AnimatePresence initial={false}>
               {filteredPayments.length === 0 ? (
                  <div className="py-32 text-center opacity-20">
                     <Database size={60} className="mx-auto mb-6 text-slate-400" />
                     <p className="font-black uppercase tracking-[0.3em] text-[12px] text-slate-400 italic">No Synchronization Markers</p>
                  </div>
               ) : (
                  filteredPayments.map((p) => (
                     <motion.div 
                       key={p.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-white transition-all relative group"
                     >
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <Avatar src={p.profileImage} name={p.studentName} size={12} />
                              <div>
                                 <p className="text-lg font-black text-slate-900 uppercase italic leading-none">{p.studentName}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">{new Date(p.date || Date.now()).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => handleAudit(p.id)}
                             disabled={auditLoadingId === p.id}
                             className={`p-3 rounded-xl transition-all ${auditLoadingId === p.id ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}
                           >
                              {auditLoadingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="p-4 bg-white rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">YIELD</p>
                              <p className="text-xl font-black text-slate-900 italic tabular-nums">${(p.amount || 0).toLocaleString()}</p>
                           </div>
                           <div className="p-4 bg-white rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">SYNC STATE</p>
                              <div className="scale-75 origin-left">
                                 <PaymentStatusBadge status={p.status} />
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                           <span className="text-[9px] font-black text-slate-300 font-mono italic uppercase">REF: {p.id?.toString().slice(-8)}</span>
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-900 italic uppercase">NETWORK VERIFIED</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           </div>
                        </div>
                     </motion.div>
                  ))
               )}
            </AnimatePresence>
         </div>
      </div>
    </motion.div>
  );
}
