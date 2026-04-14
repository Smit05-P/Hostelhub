"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  ListFilter,
  UserCheck,
  Search,
  MessageSquare,
  ShieldCheck,
  Calendar,
  RefreshCw,
  UserX,
  UserPlus,
  Sparkles,
  Zap,
  Hotel,
  Target,
  Mail,
  ArrowRight,
  TrendingUp,
  Activity,
  Clock
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function JoinRequestsPage() {
  const { activeHostelId } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => {
    if (!activeHostelId) return;
    fetchRequests();
  }, [activeHostelId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/hostels/join-requests?hostelId=${activeHostelId}`);
      setRequests(res.data.requests || []);
    } catch (err) {
      toast.error("Failed to fetch join requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    const request = requests.find(r => r.id === id);
    if (!request) return;

    setProcessingId(id);
    const loadingToast = toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} request...`);
    try {
      await axios.patch(`/api/hostels/join-requests/${id}`, {
        action,
        studentId: request.userId,
        hostelId: request.hostelId,
        adminNote: action === "reject" ? adminNote : "",
      });
      
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, { id: loadingToast });
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: action === "approve" ? "approved" : "rejected" } : req));
      if (action === "reject") {
        setRejectingId(null);
        setAdminNote("");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to ${action} request`;
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = (requests || []).filter(r => {
    if (r.status !== filter) return false;
    if (search && !r.userName?.toLowerCase().includes(search.toLowerCase()) && !r.userEmail?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pendingCount = (requests || []).filter(r => r.status === "pending").length;
  const approvedCount = (requests || []).filter(r => r.status === "approved").length;
  const rejectedCount = (requests || []).filter(r => r.status === "rejected").length;

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12"
      >
        <div className="space-y-6">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
             <ShieldCheck size={14} className="animate-pulse" />
             Access Protocol Core
           </div>
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 italic uppercase">
             Registration <span className="text-indigo-600">Nexus</span>
           </h1>
           <p className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed">
             Orchestrate student onboarding and verify incoming facility authorization requests.
           </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchRequests}
            className="h-14 px-8 bg-white border border-slate-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-50 transition-all shadow-xl shadow-indigo-500/5 active:scale-95 flex items-center gap-4 group"
          >
            <RefreshCw size={18} className={`${loading ? "animate-spin text-indigo-500" : "group-hover:rotate-180 transition-transform duration-700"}`} />
            Sync Core Status
          </button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {[
          { label: "Pending Wave", count: pendingCount, icon: Clock, color: "amber", delay: 0.1 },
          { label: "Approved Nodes", count: approvedCount, icon: UserPlus, color: "emerald", delay: 0.2 },
          { label: "Rejected Streams", count: rejectedCount, icon: UserX, color: "rose", delay: 0.3 }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: stat.delay }}
            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-indigo-500/5 flex flex-col group hover:border-indigo-500/30 transition-all"
          >
            <div className={`w-14 h-14 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-600 mb-6 border border-${stat.color}-500/20 shadow-inner group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div className="flex items-end justify-between">
               <div className="space-y-1">
                 <p className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">{stat.count}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{stat.label}</p>
               </div>
               <TrendingUp size={24} className={`text-${stat.color}-500/20`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-500/5 overflow-hidden min-h-[600px] flex flex-col"
      >
        {/* Toolbar */}
        <div className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-slate-50/20 border-b border-slate-100">
          <div className="flex items-center bg-slate-100/50 p-2 rounded-[1.25rem] border border-slate-200/50 w-fit">
            {["pending", "approved", "rejected"].map(s => (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] italic rounded-xl transition-all ${
                  filter === s 
                  ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
                  : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-lg group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-all" />
            <input
              type="text"
              placeholder="Search Subject ID / Authorization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all text-sm font-black uppercase tracking-widest placeholder:text-slate-200 placeholder:italic shadow-inner"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Subject Profile</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Access Vector</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Time Stamp</th>
                <th className="px-10 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Directive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                        <div className="space-y-3">
                          <div className="h-4 bg-slate-100 rounded-full w-40" />
                          <div className="h-3 bg-slate-50 rounded-full w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8"><div className="h-8 bg-slate-100 rounded-xl w-28" /></td>
                    <td className="px-10 py-8"><div className="h-8 bg-slate-100 rounded-xl w-32" /></td>
                    <td className="px-10 py-8"><div className="h-12 bg-slate-50 rounded-2xl w-40 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan={4} className="px-10 py-48 text-center">
                    <div className="flex flex-col items-center gap-6 text-slate-400 max-w-sm mx-auto">
                      <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner">
                        <Activity size={40} className="text-slate-200 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Sync Void</p>
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No high-priority requests detected in the current data stream.</p>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                filteredRequests.map((req, idx) => (
                  <motion.tr 
                    key={req.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-indigo-50/30 transition-all duration-500"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-lg uppercase italic shadow-inner group-hover:bg-white group-hover:border-indigo-200 transition-all">
                          {req.userName?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">{req.userName}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            <Mail size={12} className="text-indigo-400/40" />
                            {req.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border shadow-sm transition-all ${
                        req.method === 'code' 
                        ? 'bg-amber-500/10 text-amber-700 border-amber-200 shadow-amber-500/5' 
                        : 'bg-indigo-500/10 text-indigo-700 border-indigo-200 shadow-indigo-500/5'
                      }`}>
                         {req.method === "code" ? (
                           <> <Zap size={14} className="animate-pulse" /> Join Key </>
                         ) : (
                           <> <Target size={14} /> Direct Vector </>
                         )}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2.5 text-xs font-black text-slate-700 uppercase italic tracking-wider">
                          <Calendar size={16} className="text-indigo-500/30" />
                          {new Date(req.requestedAt || req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          <Clock size={12} className="text-slate-300" />
                          {new Date(req.requestedAt || req.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      {req.status === 'pending' ? (
                        rejectingId === req.id ? (
                          <div className="flex items-center justify-end gap-3 animate-in slide-in-from-right-4 duration-500">
                            <input 
                              type="text" 
                              autoFocus
                              placeholder="Reason for intercept..." 
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              className="text-[10px] font-black uppercase tracking-widest px-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 w-80 shadow-inner"
                            />
                            <button 
                              onClick={() => handleAction(req.id, "reject")}
                              className="w-12 h-12 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg active:scale-90 flex items-center justify-center"
                              title="Confirm Action"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                            <button 
                              onClick={() => { setRejectingId(null); setAdminNote(""); }}
                              className="w-12 h-12 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all active:scale-90 flex items-center justify-center"
                              title="Cancel"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-500">
                            <button 
                              onClick={() => handleAction(req.id, "approve")}
                              className="h-14 px-8 bg-indigo-600 text-white hover:bg-slate-900 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] italic transition-all shadow-xl shadow-indigo-600/10 active:scale-95 flex items-center gap-4"
                            >
                              <UserPlus size={18} />
                              Authorize
                            </button>
                            <button 
                              onClick={() => setRejectingId(req.id)}
                              className="w-14 h-14 bg-white border border-slate-200 text-slate-300 hover:text-rose-600 hover:border-rose-200 rounded-[1.5rem] transition-all shadow-xl shadow-indigo-500/5 active:scale-95 flex items-center justify-center"
                              title="Intercept Stream"
                            >
                              <UserX size={20} />
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="flex justify-end">
                        <span className={`inline-flex items-center gap-3 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.4em] italic border shadow-inner transition-all ${
                          req.status === 'approved' 
                          ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' 
                          : 'bg-rose-500/5 text-rose-600 border-rose-500/20'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${req.status === 'approved' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                          {req.status}
                        </span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
              </AnimatePresence>
            </tbody>
           </table>
         </div>
       </motion.div>

      {/* Footer / Context Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden group border border-slate-800 shadow-2xl shadow-slate-900/10"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
            <ShieldCheck size={160} />
          </div>
          <div className="relative z-10 space-y-8">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-3xl border border-white/10">
              <ShieldCheck size={32} className="text-indigo-400" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Onboarding Protocol</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                Authorized subjects are automatically provisioned with secure portal keys and integrated into the facility directory services.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-xl shadow-indigo-500/5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Response Flux</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Network Performance Metrics</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-inner">
               <TrendingUp size={24} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mean Response</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900 italic tracking-tighter">2.4</span>
                <span className="text-xs font-black text-slate-400 uppercase italic mb-1">HR/OPS</span>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Trust Quotient</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-900 italic tracking-tighter">92.8</span>
                <span className="text-xs font-black text-slate-400 uppercase italic mb-1">RATE%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
