"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, Clock, CheckCircle2, 
  Trash2, UserPlus, Database, ShieldCheck, Zap,
  Sparkles, Maximize2, ArrowRight, Loader2, Calendar,
  Download, RotateCcw, Monitor, ShieldAlert, Camera,
  Check, X, Timer, AlertTriangle, User, Building2,
  MoreVertical, Edit2, Eye
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { visitorService } from "@/services/visitorService";

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

export default function AdminVisitorsPage() {
  const { addToast } = useToast();
  const { activeHostelId } = useAuth();
  
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);


  const fetchVisitors = async (showLoading = true) => {
    if (!activeHostelId) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const visitorData = await visitorService.getVisitors({ hostelId: activeHostelId });
      setVisitors(visitorData || []);
    } catch (err) {
      addToast("Failed to sync institutional records.", "error");
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => { fetchVisitors(); }, [activeHostelId]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await visitorService.updateStatus(id, newStatus);
      const displayStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();
      addToast(`Security marker updated to ${displayStatus}`, "success");
      fetchVisitors(false);
    } catch (err) {
      addToast("Update failed.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge entry from institutional records?")) return;
    try {
      await visitorService.deleteVisitor(id);
      addToast("Marker purged.", "info");
      fetchVisitors();
    } catch (err) {
      addToast("Deletion request failed.", "error");
    }
  };

  const handleGeneralBroadcast = async () => {
    if (!activeHostelId) {
      addToast("Hostel context missing. Please refresh.", "error");
      return;
    }

    setIsBroadcasting(true);
    try {
      const activeCount = visitors.filter(v => v.status === 'Pending' || v.status === 'Approved').length;
      await axios.post("/api/visitors/broadcast", {
        hostelId: activeHostelId,
        guestCountHint: activeCount,
        visitorName: "SECURITY PROTOCOL",
        visitorType: "Official",
        purpose: "General Visitor Awareness Broadcast",
        location: "Facility-Wide",
        audience: "all_users",
      });
      addToast(`General security broadcast transmitted (${activeCount} active visitors).`, "success");
    } catch (err) {
      addToast("Broadcast failed.", "error");
    } finally {
      setIsBroadcasting(false);
    }
  };





  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
      const matchesSearch = 
        v.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.roomNo?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || v.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [visitors, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      active: visitors.filter(v => v.status === 'Completed').length,
      pending: visitors.filter(v => v.status === 'Pending').length,
      totalToday: visitors.filter(v => {
        const today = new Date().toISOString().split('T')[0];
        const visitDate = v.visitDate ? new Date(v.visitDate).toISOString().split('T')[0] : '';
        return visitDate === today;
      }).length,
      completed: visitors.filter(v => v.status === 'Completed').length
    };
  }, [visitors]);

  if (loading && visitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-8">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-[6px] border-slate-900/10 border-t-slate-900 rounded-full" 
          />
          <ShieldCheck className="absolute inset-0 m-auto text-slate-900 animate-pulse" size={24} />
        </div>
        <p className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-400 italic">Syncing Security Visitor Hub...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={CONTAINER_VARIANTS}
      className="space-y-12 pb-24 max-w-[1600px] mx-auto"
    >
      {/* Header & Stats */}
      {/* Protocol Hub Header */}
      <div className="relative overflow-hidden rounded-[3.5rem] bg-slate-900 shadow-3xl border border-slate-800 group">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="/protocol_hub_banner_1776814407559.png" 
            alt="Protocol Hub Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent" />
        </div>
        
        <div className="relative p-12 sm:p-16 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-5 mb-8">
              <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
                 <ShieldCheck size={32} strokeWidth={2.5} />
              </div>
              <div>
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic leading-none">Security Gateway Active</span>
                 <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter mt-2 uppercase leading-none">Visitor <span className="text-indigo-400 not-italic">Hub</span></h1>
              </div>
            </div>
            <p className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.2em] italic max-w-lg leading-relaxed">
              Visitor ledger & identity verification portal.
              Track and manage guest access in real-time.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleGeneralBroadcast}
              disabled={isBroadcasting}
              className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl transition-all flex items-center gap-4 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 duration-500"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                {isBroadcasting ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">BROADCAST</div>
                <div className="text-xs font-black uppercase italic">
                  {isBroadcasting ? "TRANSMITTING..." : "INFORM GUESTS"}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: "Active Access", value: stats.active, icon: Zap, color: "bg-indigo-600", detail: "Completed Now" },
             { label: "Pending Verification", value: stats.pending, icon: Timer, color: "bg-amber-500", detail: "Awaiting Action" },
             { label: "Temporal Capacity", value: stats.totalToday, icon: Calendar, color: "bg-slate-900", detail: "Entries Today" },
             { label: "Security Purged", value: stats.completed, icon: CheckCircle2, color: "bg-emerald-600", detail: "Records Completed" }
           ].map((stat, i) => (
             <motion.div key={i} variants={ITEM_VARIANTS} className="bg-white p-10 rounded-[2.5rem] border border-slate-200/60 flex flex-col justify-between hover:shadow-2xl transition-all relative overflow-hidden group shadow-sm">
                <div className={`absolute -right-8 -top-8 w-32 h-32 ${stat.color} opacity-5 rounded-full transition-transform group-hover:scale-150 duration-700`} />
                <div className="flex items-center justify-between">
                   <div className={`w-14 h-14 rounded-[1.5rem] ${stat.color} bg-opacity-10 flex items-center justify-center text-slate-900 border border-white/20 italic`}>
                      <stat.icon size={28} className={stat.color.replace('bg-', 'text-')} />
                   </div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{stat.detail}</span>
                </div>
                <div className="mt-10">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">{stat.label}</p>
                   <p className="text-4xl font-black text-slate-900 italic tracking-tighter mt-3">{stat.value}</p>
                </div>
             </motion.div>
           ))}
        </div>


      {/* Controls */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6 bg-white p-6 sm:p-4 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-200 shadow-xl">
         <div className="relative group flex-1">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH VISITOR, ROOM, OR STUDENT NAME..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 placeholder:text-slate-300 italic"
            />
         </div>
         
         <div className="h-8 w-[1px] bg-slate-100 hidden xl:block" />

         <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-50 rounded-[2rem] border border-slate-100">
            {["All", "Pending", "Approved", "Completed", "Rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap ${
                  statusFilter === s 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                }`}
              >
                {s}
              </button>
            ))}
         </div>
      </div>

      {/* Ledger Table (Desktop) / Card Stack (Mobile) */}
      <div className="bg-white rounded-[3rem] sm:rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden p-2 sm:p-3">
         {/* Desktop Table View */}
         <div className="hidden lg:block overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[1200px]">
               <thead>
                  <tr className="bg-slate-50/50">
                     {[
                       "Visitor", "Student", "Room No.", "Schedule", "Status", "Actions"
                     ].map((h, i) => (
                       <th key={i} className={`px-10 py-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                     ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  <AnimatePresence initial={false}>
                    {filteredVisitors.length === 0 ? (
                      <tr>
                         <td colSpan={6} className="py-56 text-center opacity-20">
                            <Database size={80} className="mx-auto mb-8 text-slate-400" />
                            <p className="font-black uppercase tracking-[0.5em] text-[14px] text-slate-400 italic">No Synchronization Markers Match Filters</p>
                         </td>
                      </tr>
                    ) : (
                      filteredVisitors.map((v) => (
                        <motion.tr 
                          key={v._id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.3 }}
                          className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                        >
                           <td className="px-10 py-9" onClick={() => setSelectedVisitor(v)}>
                              <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 text-lg font-black italic border border-slate-200 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                                    {v.visitorImage ? (
                                      <img src={v.visitorImage} alt={v.visitorName} className="w-full h-full object-cover" />
                                    ) : (
                                      v.visitorName?.[0]
                                    )}
                                 </div>
                                 <div className="flex flex-col">
                                    <p className="text-lg font-black text-slate-900 uppercase tracking-tighter italic group-hover:text-indigo-600 transition-colors leading-none">{v.visitorName}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                       <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">{v.relation}</span>
                                       <span className="text-[10px] font-black text-slate-300 italic">/</span>
                                       <span className="text-[10px] font-black text-slate-400 italic">{v.visitorPhone}</span>
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-9">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <User size={14} />
                                 </div>
                                  <span className={`text-[13px] font-black uppercase italic leading-none ${v.studentName === 'HOSTEL-WIDE' ? 'text-indigo-600' : 'text-slate-600'}`}>
                                    {v.studentName === 'HOSTEL-WIDE' ? 'PROTOCOL GUEST' : v.studentName}
                                  </span>
                              </div>
                           </td>
                           <td className="px-10 py-9">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                    <Building2 size={14} />
                                 </div>
                                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border italic shadow-inner transition-all ${
                                    v.roomNo === 'MANAGEMENT' 
                                    ? 'bg-slate-900 text-white border-slate-800' 
                                    : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-100'
                                  }`}>
                                    {v.roomNo === 'MANAGEMENT' ? 'INSTITUTIONAL ACCESS' : `NODE ${v.roomNo}`}
                                  </span>
                              </div>
                           </td>
                           <td className="px-10 py-9">
                              <div className="flex flex-col gap-1.5">
                                 <span className="text-[12px] font-black text-slate-700 italic flex items-center gap-2">
                                    <Calendar size={12} className="text-indigo-600" />
                                    {new Date(v.visitDate).toLocaleDateString()}
                                 </span>
                                 <span className="text-[10px] font-black text-slate-400 italic flex items-center gap-2 uppercase tracking-widest">
                                    <Clock size={12} />
                                    {v.visitTime}
                                 </span>
                              </div>
                           </td>
                           <td className="px-10 py-9">
                              <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic border ${
                                v.status === 'Completed' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                                v.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                v.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                 <div className={`w-2 h-2 rounded-full ${
                                   v.status === 'Approved' ? 'bg-emerald-500' :
                                   v.status === 'Rejected' ? 'bg-rose-500' :
                                   v.status === 'Completed' ? 'bg-slate-300' : 'bg-amber-500 animate-pulse'
                                 }`} />
                                 {v.status}
                              </div>
                           </td>
                           <td className="px-10 py-9 text-right">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                 {v.status === 'Pending' && (
                                   <>
                                     <button 
                                       onClick={() => handleStatusUpdate(v._id, 'Completed')}
                                       className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center border border-emerald-100"
                                     >
                                        <Check size={20} />
                                     </button>
                                     <button 
                                       onClick={() => handleStatusUpdate(v._id, 'Rejected')}
                                       className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center justify-center border border-rose-100"
                                     >
                                        <X size={20} />
                                     </button>
                                   </>
                                 )}
                                 <button 
                                   onClick={() => {
                                      const activeCount = visitors.filter(v => v.status === 'Pending' || v.status === 'Approved').length;
                                      axios.post("/api/visitors/broadcast", {
                                        hostelId: activeHostelId,
                                        guestCountHint: activeCount,
                                        visitorName: v.visitorName,
                                        visitorType: v.visitorType || "Guest",
                                        purpose: v.purpose,
                                        location: v.roomNo || "Main Lobby",
                                        audience: "all_users",
                                      }).then(() => addToast(`Broadcast transmitted for ${v.visitorName}.`, "success"))
                                        .catch(() => addToast("Broadcast failed.", "error"));
                                   }}
                                   className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm flex items-center justify-center border border-amber-100"
                                   title="Protocol Broadcast"
                                 >
                                    <Zap size={18} />
                                 </button>
                                 <button 
                                   onClick={() => handleDelete(v._id)}
                                   className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm flex items-center justify-center border border-transparent hover:border-rose-100"
                                 >
                                    <Trash2 size={18} />
                                 </button>
                              </div>
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
               {filteredVisitors.length === 0 ? (
                  <div className="py-32 text-center opacity-20">
                     <Database size={60} className="mx-auto mb-6 text-slate-400" />
                     <p className="font-black uppercase tracking-[0.3em] text-[12px] text-slate-400 italic">No Synchronization Markers</p>
                  </div>
               ) : (
                  filteredVisitors.map((v) => (
                     <VisitorCard 
                       key={v._id} 
                       visitor={v} 
                       onSelect={() => setSelectedVisitor(v)}
                       onStatusUpdate={handleStatusUpdate}
                       onDelete={handleDelete}
                       onBroadcast={() => {
                          const activeCount = visitors.filter(v => v.status === 'Pending' || v.status === 'Approved').length;
                          axios.post("/api/visitors/broadcast", {
                            hostelId: activeHostelId,
                            guestCountHint: activeCount,
                            visitorName: v.visitorName,
                            visitorType: v.visitorType || "Guest",
                            purpose: v.purpose,
                            location: v.roomNo || "Main Lobby",
                            audience: "all_users",
                          }).then(() => addToast(`Broadcast transmitted for ${v.visitorName}.`, "success"))
                            .catch(() => addToast("Broadcast failed.", "error"));
                       }}
                     />
                  ))
               )}
            </AnimatePresence>
         </div>
      </div>
      {/* Modals */}
      <AnimatePresence>

        {selectedVisitor && (
          <VisitorDetailModal 
            visitor={selectedVisitor} 
            onClose={() => setSelectedVisitor(null)} 
            onStatusUpdate={handleStatusUpdate}
          />
        )}

      </AnimatePresence>
    </motion.div>
  );
};

const VisitorCard = ({ visitor, onSelect, onStatusUpdate, onDelete, onBroadcast }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-white transition-all relative group"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4" onClick={onSelect}>
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white flex items-center justify-center text-slate-400 font-black border border-slate-200 shrink-0">
            {visitor.visitorImage ? (
              <img src={visitor.visitorImage} alt="" className="w-full h-full object-cover" />
            ) : (
              visitor.visitorName?.[0]
            )}
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 uppercase italic leading-none">{visitor.visitorName}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">{visitor.relation}</p>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowActions(!showActions)}
            className="p-3 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          
          <AnimatePresence>
            {showActions && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setShowActions(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[70] overflow-hidden"
                >
                  <button onClick={() => { onSelect(); setShowActions(false); }} className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-3">
                    <Eye size={14} className="text-indigo-500" /> VIEW RECORD
                  </button>
                  <button onClick={() => { onBroadcast(); setShowActions(false); }} className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-3 border-t border-slate-50">
                    <Zap size={14} className="text-amber-500" /> BROADCAST
                  </button>
                  <button onClick={() => { onDelete(visitor._id); setShowActions(false); }} className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 flex items-center gap-3 border-t border-slate-50">
                    <Trash2 size={14} /> PURGE MARKER
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded-2xl border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">HOST</p>
          <p className="text-xs font-black text-slate-700 italic uppercase truncate">{visitor.studentName}</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">NODE</p>
          <p className="text-xs font-black text-slate-700 italic uppercase">ROOM {visitor.roomNo}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic border ${
          visitor.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          visitor.status === 'Completed' ? 'bg-slate-100 text-slate-400 border-slate-200' :
          'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {visitor.status}
        </div>

        {visitor.status === 'Pending' && (
          <div className="flex gap-2">
            <button 
              onClick={() => onStatusUpdate(visitor._id, 'Completed')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-lg shadow-emerald-600/20"
            >
              APPROVE
            </button>
            <button 
              onClick={() => onStatusUpdate(visitor._id, 'Rejected')}
              className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest italic"
            >
              REJECT
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const VisitorDetailModal = ({ visitor, onClose, onStatusUpdate }) => {
  const { addToast } = useToast();
  
  const handleShare = () => {
    const text = `
🛡️ HOSTELHUB VISITOR PASS
----------------------------
👤 VISITOR: ${visitor.visitorName.toUpperCase()}
🔗 RELATION: ${visitor.relation}
🏠 NODE: ${visitor.roomNo}
👤 HOST: ${visitor.studentName}
📅 DATE: ${new Date(visitor.visitDate).toLocaleDateString()}
⏰ TIME: ${visitor.visitTime}
📍 STATUS: ${visitor.status.toUpperCase()}
----------------------------
VERIFIED BY HOSTELHUB SECURITY CORE
    `.trim();
    
    navigator.clipboard.writeText(text);
    addToast("Visitor pass copied to clipboard.", "success");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-xl bg-white rounded-t-[3rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8 sm:p-10 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex justify-between items-start mb-6 sm:mb-8 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-white/10 backdrop-blur-xl">
              <ShieldCheck size={24} className="sm:size-[28px]" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={handleShare}
                className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all border border-white/5"
                title="Share Pass"
              >
                <Download size={18} className="sm:size-[20px]" />
              </button>
              <button onClick={onClose} className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all border border-white/5">
                <X size={18} className="sm:size-[20px]" />
              </button>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase mb-2 relative z-10 leading-none">IDENTITY VERIFIED</h2>
          <p className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest italic relative z-10">VISITOR SECURITY CREDENTIALS</p>
        </div>

        <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 bg-slate-50">
          <div className="flex items-center gap-6 sm:gap-8 p-5 sm:p-6 bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
            <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors duration-500" />
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200 relative z-10">
              {visitor.visitorImage ? (
                <img src={visitor.visitorImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="sm:size-[40px]" />
              )}
            </div>
            <div className="relative z-10">
              <p className="text-xl sm:text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{visitor.visitorName}</p>
              <p className="text-[10px] sm:text-[11px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em] italic flex items-center gap-2">
                <Users size={12} className="text-indigo-500" />
                {visitor.relation}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-6 sm:p-8 bg-white rounded-[1.8rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 italic">HOST RESIDENT</p>
              <p className="text-md sm:text-lg font-black text-slate-900 italic uppercase truncate">
                {visitor.studentName === 'HOSTEL-WIDE' ? 'INSTITUTIONAL CORE' : visitor.studentName}
              </p>
            </div>
            <div className="p-6 sm:p-8 bg-white rounded-[1.8rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-3 italic">ACCESS NODE</p>
              <p className="text-md sm:text-lg font-black text-slate-900 italic uppercase">
                {visitor.roomNo === 'MANAGEMENT' ? 'MANAGEMENT' : `ROOM ${visitor.roomNo}`}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-white rounded-[1.8rem] sm:rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest italic">PURPOSE OF VISIT</p>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic border ${
                visitor.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                visitor.status === 'Completed' ? 'bg-slate-100 text-slate-400 border-slate-200' :
                'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {visitor.status}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-600 italic leading-relaxed">"{visitor.purpose}"</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 sm:pt-0">
            {visitor.status === 'Pending' && (
              <button 
                onClick={() => { onStatusUpdate(visitor._id, 'Completed'); onClose(); }}
                className="flex-1 py-4 sm:py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
              >
                MARK COMPLETED
              </button>
            )}
            <button 
              onClick={handleShare}
              className="flex-1 py-4 sm:py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-slate-800 transition-all shadow-xl"
            >
              SHARE PASS
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


