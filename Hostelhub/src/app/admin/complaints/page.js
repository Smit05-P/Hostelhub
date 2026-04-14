"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Search, Filter, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, User, Hash, Tag, 
  Calendar, RotateCcw, Database, ShieldAlert, Zap,
  Sparkles, Maximize2, Trash2, Send
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

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

const ComplaintCard = ({ complaint, onUpdateStatus, onDelete }) => {
  const isResolved = complaint.status === "resolved";
  const isPending = complaint.status === "pending";

  return (
    <motion.div
      variants={ITEM_VARIANTS}
      whileHover={{ y: -5, scale: 1.01 }}
      className="premium-glass rounded-[3rem] border border-slate-200/60 overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 h-full bg-white shadow-xl"
    >
      <div className="p-10 flex flex-col h-full">
         <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
               <div className={`p-4 rounded-[1.5rem] ${isResolved ? 'bg-emerald-600/10 text-emerald-600' : isPending ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'} border border-white/20 shadow-inner group-hover:scale-110 transition-transform`}>
                  <MessageSquare size={22} strokeWidth={2.5} />
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">Ticket Marker</span>
                  <span className="text-sm font-black text-slate-900 uppercase italic mt-1.5 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{complaint.id?.slice(-8) || 'UNIT-007'}</span>
               </div>
            </div>
            <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border italic shadow-sm ${
              isResolved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
              isPending ? 'bg-amber-50 text-amber-600 border-amber-100' : 
              'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
               {complaint.status}
            </div>
         </div>

         <div className="space-y-6 mb-10 flex-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{complaint.title}</h3>
            <p className="text-[12px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter italic opacity-80 group-hover:opacity-100 transition-all">
               {complaint.description}
            </p>
         </div>

         <div className="space-y-6 mt-auto">
            <div className="flex items-center gap-4 pt-8 border-t border-slate-50">
               <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-[12px] font-black text-white italic shadow-lg shadow-indigo-500/10">
                  {complaint.studentName?.[0] || 'U'}
               </div>
               <div className="flex flex-col">
                  <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight italic">{complaint.studentName || 'Resident Unknown'}</span>
                  <div className="flex items-center gap-3 mt-1">
                     <Clock size={12} className="text-slate-300" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">
                        {new Date(complaint.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                     </span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-3">
               {!isResolved && (
                 <button 
                   onClick={() => onUpdateStatus(complaint.id, 'resolved')}
                   className="flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all italic shadow-2xl shadow-emerald-500/20 active:scale-95"
                 >
                   RESOLVE <CheckCircle2 size={16} />
                 </button>
               )}
               <button 
                 onClick={() => onDelete(complaint.id)}
                 className="p-4 rounded-[1.5rem] bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all shadow-sm active:scale-90"
               >
                 <Trash2 size={18} />
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

export default function AdminComplaintsPage() {
  const { addToast } = useToast();
  const { activeHostelId } = useAuth();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchComplaints = async () => {
    if (!activeHostelId) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/complaints", { params: { hostelId: activeHostelId } });
      setComplaints(res.data || []);
    } catch (err) {
      addToast("Failed to sync feedback domain.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [activeHostelId]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.studentName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchQuery, statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`/api/complaints/${id}`, { status });
      addToast(`Ticket status: ${status}.`, "success");
      fetchComplaints();
    } catch (err) {
      addToast("Failed to update ticket.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge ticket from system records?")) return;
    try {
      await axios.delete(`/api/complaints/${id}`);
      addToast("Ticket purged.", "info");
      fetchComplaints();
    } catch (err) {
      addToast("Deletion failed.", "error");
    }
  };

  if (loading && complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-8">
        <div className="relative">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-[2rem] bg-amber-500 flex items-center justify-center text-white shadow-2xl shadow-amber-500/20"
          >
            <MessageSquare size={36} />
          </motion.div>
          <Zap className="absolute -top-3 -right-3 text-amber-500 animate-pulse" size={24} />
        </div>
        <p className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-400 italic">Syncing Resident Feedback Core...</p>
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
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
         <div>
            <div className="inline-flex items-center gap-4 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-amber-100 italic mb-5 shadow-sm">
               INSTITUTIONAL FEEDBACK MESH
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none flex items-center gap-5">
               <ShieldAlert size={48} className="text-amber-500" /> RESOLUTION HUB
            </h1>
            <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.3em] mt-5 italic leading-none opacity-80">Mediating resident tickets through institutional protocols</p>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-xl">
            <div className="relative group w-full sm:w-72">
               <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search Ticket ID..."
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
              <option value="pending">ACTIVE TICKETS</option>
              <option value="resolved">CLOSED LOOPS</option>
            </select>
            <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
            <button 
              onClick={fetchComplaints}
              className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-inner border border-slate-100 italic"
            >
              <RotateCcw size={16} />
            </button>
         </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Total Load", value: complaints.length, color: "bg-slate-900" },
           { label: "Active Dissonance", value: complaints.filter(c => c.status === 'pending').length, color: "bg-amber-500" },
           { label: "Closed Integrities", value: complaints.filter(c => c.status === 'resolved').length, color: "bg-emerald-600" },
           { label: "Critical Response", value: "Active", color: "bg-rose-600" }
         ].map((stat, i) => (
           <motion.div key={i} variants={ITEM_VARIANTS} className="premium-glass p-8 rounded-[2.5rem] border border-slate-200/60 flex items-center justify-between shadow-lg group">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">{stat.label}</span>
                 <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${stat.color} bg-opacity-10 flex items-center justify-center text-slate-900 border border-white/20 shadow-inner italic transition-transform group-hover:scale-110`}>
                 <Zap size={18} className={stat.color.replace('bg-', 'text-')} />
              </div>
           </motion.div>
         ))}
      </div>

      {/* Grid Area */}
      <div className="bg-slate-50/50 rounded-[4rem] border border-slate-100 p-12 shadow-inner">
         {filteredComplaints.length === 0 ? (
           <div className="py-32 flex flex-col items-center justify-center gap-8 opacity-20">
              <Database size={80} className="text-slate-400" />
              <p className="font-black uppercase tracking-[0.5em] text-[14px] text-slate-400 italic">No Synchronization Markers Match Filters</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              <AnimatePresence mode="popLayout">
                {filteredComplaints.map((complaint) => (
                  <ComplaintCard 
                    key={complaint.id} 
                    complaint={complaint} 
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
           </div>
         )}
      </div>
    </motion.div>
  );
}
