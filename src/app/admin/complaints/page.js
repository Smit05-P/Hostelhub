"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Search, Filter, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, User, Hash, Tag, 
  Calendar, RotateCcw, Database, ShieldAlert, Zap,
  Sparkles, Maximize2, Trash2, Send, X, Plus
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

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

const ComplaintCard = ({ complaint, onUpdateStatus, onDelete, onViewDetails }) => {
  const statusLower = (complaint.status || "").toLowerCase();
  
  const getStatusConfig = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return { label: 'OPEN', color: 'text-rose-500', bgColor: 'bg-rose-50', iconColor: 'text-rose-500', barColor: 'bg-rose-500' };
      case 'in-progress': return { label: 'WORK', color: 'text-amber-500', bgColor: 'bg-amber-50', iconColor: 'text-amber-500', barColor: 'bg-amber-500' };
      case 'resolved': return { label: 'DONE', color: 'text-emerald-500', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-500', barColor: 'bg-emerald-500' };
      case 'closed': return { label: 'CLOSE', color: 'text-slate-500', bgColor: 'bg-slate-50', iconColor: 'text-slate-500', barColor: 'bg-slate-500' };
      default: return { label: status.toUpperCase(), color: 'text-slate-400', bgColor: 'bg-slate-50', iconColor: 'text-slate-400', barColor: 'bg-slate-400' };
    }
  };

  const config = getStatusConfig(complaint.status || 'pending');

  return (
    <motion.div
      variants={ITEM_VARIANTS}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative group h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[3.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative h-full bg-white rounded-[3.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-indigo-500/10">
         {/* Status Bar */}
         <div className={`h-2 w-full ${config.barColor} opacity-20`} />
         
         <div className="p-8 sm:p-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-8">
               <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-[1.8rem] ${config.bgColor} ${config.iconColor} shadow-inner group-hover:rotate-6 transition-transform duration-500`}>
                     <MessageSquare size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">Protocol Ticket</span>
                     <span className="text-sm font-black text-slate-900 uppercase italic mt-1.5 font-mono bg-slate-50 px-3 py-1 rounded-lg border border-slate-100/50">#{complaint._id?.slice(-6) || 'X-001'}</span>
                  </div>
               </div>
               <button 
                  onClick={() => onViewDetails(complaint)}
                  className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100"
               >
                  <Maximize2 size={16} strokeWidth={3} />
               </button>
            </div>

            <div className="space-y-4 mb-8 flex-1 min-h-0">
               <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight group-hover:text-indigo-600 transition-colors break-words line-clamp-2">
                 {complaint.subject || complaint.title || "No Subject Specified"}
               </h3>
               <p className="text-[12px] sm:text-[13px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter italic opacity-70 group-hover:opacity-100 transition-all break-words line-clamp-3">
                  {complaint.description}
               </p>
            </div>

            <div className="space-y-6 mt-auto pt-6 border-t border-slate-50">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                     <div className="w-12 h-12 rounded-[1rem] bg-slate-900 flex-shrink-0 flex items-center justify-center text-[14px] font-black text-white italic shadow-lg shadow-indigo-500/10 overflow-hidden relative">
                        {complaint.studentName?.[0] || 'U'}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent" />
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight italic truncate">{complaint.studentName || 'Resident Unknown'}</span>
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-black uppercase italic ${config.color}`}>{config.label}</span>
                           {complaint.roomNumber && (
                              <span className="text-[10px] font-black text-slate-400 uppercase italic">• RM {complaint.roomNumber}</span>
                           )}
                        </div>
                     </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                     <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-1">Created</span>
                     <span className="text-[10px] font-black text-slate-900 uppercase italic">
                        {new Date(complaint.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                     </span>
                  </div>
               </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Pending', 'In-Progress', 'Resolved', 'Closed'].map((s) => (
                         <button 
                           key={s}
                           onClick={() => onUpdateStatus(complaint._id, s)}
                           disabled={complaint.status === s}
                           className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-300 italic border ${
                             complaint.status === s 
                               ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                               : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                           }`}
                         >
                           {s === 'In-Progress' ? 'WORK' : s === 'Pending' ? 'OPEN' : s === 'Resolved' ? 'DONE' : 'CLOSE'}
                         </button>
                      ))}
                   </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                     <button 
                        onClick={() => onViewDetails(complaint)}
                        className="flex-[3] py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all italic flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95"
                     >
                        <Plus size={16} strokeWidth={3} /> VIEW & RESPOND
                     </button>
                     <button 
                        onClick={() => onDelete(complaint._id)}
                        className="flex-1 py-4 rounded-2xl bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all italic border border-rose-100 flex items-center justify-center shadow-sm"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

const ResponseModal = ({ complaint, onClose, onSubmit }) => {
  const [response, setResponse] = useState(complaint.remarks || "");
  const [status, setStatus] = useState(complaint.status);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(complaint._id, { status, response });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white w-full max-w-3xl rounded-t-[3rem] sm:rounded-[4rem] overflow-hidden shadow-2xl border border-slate-200/50 flex flex-col max-h-[90vh] sm:max-h-[95vh]"
      >
        <div className="relative p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-[1.2rem] sm:rounded-[2.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner border border-indigo-100/50 shrink-0">
                <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-tight truncate">Resolution Protocol</h2>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mt-1 truncate">ID: #{complaint._id?.slice(-8)}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 sm:p-3 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
            >
              <X size={20} sm:size={24} />
            </button>
          </div>

          <div className="bg-slate-50/80 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 mb-8 sm:mb-12 space-y-4 sm:space-y-6">
             <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] italic">Issue Context</span>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase italic bg-white px-3 py-1 rounded-full border border-slate-100">{new Date(complaint.createdAt).toLocaleDateString()}</span>
             </div>
             <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase italic tracking-tight leading-tight">{complaint.subject}</h3>
                <div className="w-12 h-1 bg-indigo-500/20 rounded-full" />
             </div>
             <div className="max-h-32 sm:max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                <p className="text-[12px] sm:text-[14px] font-bold text-slate-600 uppercase tracking-tighter italic leading-relaxed opacity-90 whitespace-pre-wrap">{complaint.description}</p>
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/50">
                <div className="flex flex-col">
                   <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase italic">Resident</span>
                   <span className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase italic truncate">{complaint.studentName || 'Unknown'}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase italic">Location</span>
                   <span className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase italic">RM {complaint.roomNumber || 'N/A'}</span>
                </div>
                <div className="hidden sm:flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase italic">Category</span>
                   <span className="text-[11px] font-black text-slate-900 uppercase italic">{complaint.category || 'General'}</span>
                </div>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">
            <div className="space-y-6">
               <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic ml-2">Resolution State</label>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                 {[
                   { id: 'Pending', label: 'OPEN' },
                   { id: 'In-Progress', label: 'WORK' },
                   { id: 'Resolved', label: 'DONE' },
                   { id: 'Closed', label: 'CLOSE' }
                 ].map((s) => (
                   <button
                     key={s.id}
                     type="button"
                     onClick={() => setStatus(s.id)}
                     className={`py-4 sm:py-5 rounded-[1.2rem] sm:rounded-[1.5rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic border transition-all duration-500 ${
                       status === s.id 
                         ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]' 
                         : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200 hover:bg-white'
                     }`}
                   >
                     {s.label}
                   </button>
                 ))}
               </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic ml-2">Formal Response</label>
              <textarea 
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Resolution details..."
                className="w-full h-32 sm:h-48 p-6 sm:p-8 rounded-[1.8rem] sm:rounded-[3rem] bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300 resize-none outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-4 sm:pt-0">
               <button 
                 disabled={loading}
                 className="flex-[2] py-5 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-slate-900 text-white text-[11px] sm:text-[12px] font-black uppercase tracking-[0.3em] italic hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50 active:scale-[0.98] group/submit"
               >
                 {loading ? "SYNCING..." : (
                   <>
                     COMMIT PROTOCOL 
                     <Send size={18} className="group-hover:translate-x-2 group-hover:-translate-y-1 transition-transform" />
                   </>
                 )}
               </button>
               <button 
                 type="button"
                 onClick={onClose}
                 className="flex-1 py-5 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] bg-white text-slate-400 text-[11px] sm:text-[12px] font-black uppercase tracking-[0.3em] italic border border-slate-100 hover:bg-slate-50 transition-all"
               >
                 Dismiss
               </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminComplaintsPage() {
  const { addToast } = useToast();
  const { activeHostelId } = useAuth();
  const queryClient = useQueryClient();
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchComplaints = async () => {
    if (!activeHostelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/api/complaints", { params: { hostelId: activeHostelId } });
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
      const matchesSearch = (c.subject || c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (c.studentName || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || (c.status || "").toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchQuery, statusFilter]);

  const handleUpdateStatus = async (idOrComplaint, statusOrData) => {
    // If first arg is an object, it's the complaint for the modal
    if (typeof idOrComplaint === 'object' && !statusOrData) {
      setSelectedComplaint(idOrComplaint);
      return;
    }

    const id = idOrComplaint;
    try {
      const payload = typeof statusOrData === 'string' ? { status: statusOrData } : statusOrData;
      await axios.patch(`/api/complaints/${id}`, payload);
      addToast(`Complaint updated successfully`, "success");
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
      <div className="flex flex-col gap-10">
         <div className="relative overflow-hidden rounded-[3rem] sm:rounded-[4rem] bg-slate-900 p-8 sm:p-16 border border-slate-800 shadow-2xl">
            {/* Background Image/Aesthetic */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
               <img 
                 src="/resolution_hub_banner_1776812229238.png" 
                 alt="Resolution Mesh" 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </div>

            <div className="relative z-10">
               <div className="inline-flex items-center gap-4 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full text-[9px] font-black uppercase tracking-[0.4em] border border-amber-500/20 italic mb-6">
                  <ShieldAlert size={14} /> INSTITUTIONAL FEEDBACK MESH
               </div>
               <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase italic leading-none mb-6">
                  RESOLUTION <span className="text-amber-500">HUB</span>
               </h1>
               <p className="text-slate-400 text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.2em] italic max-w-2xl leading-relaxed">
                  Real-time protocol mediation and resident feedback synchronization. 
                  Maintaining institutional integrity through transparent ticket resolution.
               </p>
            </div>
         </div>

         {/* Refined Filter Terminal */}
         <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-200 shadow-xl p-4 sm:p-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 px-4 border-r border-slate-100 hidden lg:flex">
               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Filter size={18} />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Filters</span>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
               {/* Status Toggles - Scrollable on mobile */}
               <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-[1.5rem] border border-slate-100 overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { id: 'all', label: 'ALL' },
                    { id: 'pending', label: 'OPEN' },
                    { id: 'in-progress', label: 'WORK' },
                    { id: 'resolved', label: 'DONE' },
                    { id: 'closed', label: 'CLOSE' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setStatusFilter(opt.id)}
                      className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider italic transition-all duration-300 min-w-[70px] ${
                        statusFilter === opt.id 
                          ? 'text-indigo-600' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {statusFilter === opt.id && (
                        <motion.div 
                          layoutId="activeFilter"
                          className="absolute inset-0 bg-white shadow-sm border border-slate-100 rounded-xl"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{opt.label}</span>
                    </button>
                  ))}
               </div>

               {/* Search Interface */}
               <div className="flex-1 relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="SEARCH PROTOCOLS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none italic"
                  />
               </div>
            </div>

            <button 
              onClick={fetchComplaints}
              className="px-6 py-4 bg-slate-900 text-white rounded-[1.5rem] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg group"
            >
              <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Sync Feed</span>
            </button>
         </div>
      </div>

      {/* Stats Summary */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "Total Load", value: complaints.length, color: "from-slate-900 to-slate-800", icon: Database },
            { label: "Active Dissonance", value: complaints.filter(c => (c.status || "").toLowerCase() === 'pending').length, color: "from-amber-500 to-orange-500", icon: ShieldAlert },
            { label: "Closed Integrities", value: complaints.filter(c => (c.status || "").toLowerCase() === 'resolved').length, color: "from-emerald-600 to-teal-600", icon: CheckCircle2 },
            { label: "Critical Response", value: "Active", color: "from-rose-600 to-pink-600", icon: Zap }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              variants={ITEM_VARIANTS} 
              className="relative group h-full overflow-hidden"
            >
               <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
               <div className="premium-glass p-10 rounded-[3rem] border border-slate-200/60 flex flex-col justify-between h-full shadow-xl shadow-slate-200/20 group-hover:shadow-2xl transition-all duration-500 bg-white">
                  <div className="flex items-center justify-between mb-8">
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">{stat.label}</span>
                     <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-500`}>
                        <stat.icon size={20} />
                     </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <p className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none">{stat.value}</p>
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
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
                    key={complaint._id} 
                    complaint={complaint} 
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                    onViewDetails={handleUpdateStatus}
                  />
                ))}
              </AnimatePresence>
           </div>
         )}
      </div>
      {/* Response Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <ResponseModal 
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onSubmit={handleUpdateStatus}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
