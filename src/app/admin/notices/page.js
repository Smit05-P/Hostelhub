"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, Search, Filter, Clock, CheckCircle2, 
  Trash2, Send, Plus, Pencil, X, Loader2,
  Calendar, AlertCircle, Database, ShieldAlert, Zap,
  Sparkles, Maximize2, Trash, Bell, Info, TrendingUp,
  ArrowRight, ShieldCheck
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useNotices } from "@/hooks/useNotices";
import { useAuth } from "@/contexts/AuthContext";

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

import { SkeletonHero, Shimmer } from "@/components/ui/Skeleton";

export default function AdminNoticesPage() {
  const { addToast } = useToast();
  const { activeHostelId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    _id: null,
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    priority: "medium",
    category: "General"
  });

  const { data: notices = [], isLoading: loading, refetch: refetchNotices } = useNotices();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeHostelId) {
       addToast("Identity failure: No active hostel node selected.", "error");
       return;
    }
    if (!formData.title || !formData.description) {
      addToast("Required markers missing.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, hostelId: activeHostelId };
      if (isEditing) {
        await axios.put(`/api/notices/${formData._id}`, payload);
        addToast("Broadcast updated.", "success");
      } else {
        await axios.post("/api/notices", payload);
        addToast("Broadcast initiated.", "success");
      }
      resetForm();
      setShowForm(false);
      refetchNotices();
    } catch (error) {
      addToast("Transmission failure.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      _id: null,
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      priority: "medium",
      category: "General"
    });
    setIsEditing(false);
  };

  const handleEdit = (notice) => {
    setFormData({
      _id: notice._id,
      title: notice.title,
      description: notice.description,
      date: notice.date ? notice.date.split("T")[0] : "",
      priority: notice.priority,
      category: notice.category || "General"
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirm permanent removal of this broadcast?")) return;
    try {
      await axios.delete(`/api/notices/${id}`);
      addToast("Broadcast purged.", "info");
      refetchNotices();
    } catch (error) {
      addToast("Deletion request failed.", "error");
    }
  };

  const filteredNotices = useMemo(() => {
    return (notices || []).filter(n => 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notices, searchQuery]);

  if (!activeHostelId) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-8">
        <ShieldAlert size={64} className="text-slate-200" />
        <p className="font-black uppercase tracking-[0.4em] text-[12px] text-slate-400 italic">Target Node Unidentified. Select a Hostel to continue.</p>
      </div>
    );
  }

  if (loading && notices.length === 0) {
    return (
      <div className="p-4 sm:p-8 space-y-12 pb-32">
        <SkeletonHero />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl p-10 space-y-6">
              <Shimmer className="w-1/4 h-6 rounded-xl" />
              <Shimmer className="w-full h-8 rounded-xl" />
              <Shimmer className="w-full h-24 rounded-3xl" />
              <div className="flex justify-between pt-6">
                <Shimmer className="w-24 h-10 rounded-2xl" />
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
      className="p-4 sm:p-8 space-y-12 sm:space-y-16 pb-32"
    >
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-10">
         <div className="relative overflow-hidden rounded-[3rem] sm:rounded-[4rem] bg-indigo-950 p-8 sm:p-16 border border-indigo-900 shadow-2xl">
            {/* Background Image/Aesthetic */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
               <img 
                 src="/notice_board_banner_1776812276534.png" 
                 alt="Broadcast Mesh" 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-indigo-950/40 to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
               <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-4 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-[0.4em] border border-indigo-500/20 italic mb-6">
                     <Bell size={14} /> NEWSFEED TERMINAL
                  </div>
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase italic leading-none mb-6">
                     NOTICE <span className="text-indigo-400">BOARD</span>
                  </h1>
                  <p className="text-indigo-200/60 text-[11px] sm:text-[13px] font-bold uppercase tracking-[0.2em] italic leading-relaxed">
                     Propagating institutional protocols and administrative broadcasts across the resident cluster network.
                     Ensuring all nodes remain synchronized with core directives.
                  </p>
               </div>
               
               <button
                 onClick={() => {
                    if (isEditing) resetForm();
                    setShowForm(!showForm);
                 }}
                 className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl flex items-center justify-center gap-4 italic shrink-0 ${
                   showForm 
                     ? 'bg-rose-500 text-white shadow-rose-500/20' 
                     : 'bg-indigo-600 text-white hover:bg-indigo-500'
                 }`}
               >
                 {showForm ? <X size={20} strokeWidth={3} /> : <Plus size={20} strokeWidth={3} />} 
                 {showForm ? "CANCEL" : "CREATE NOTICE"}
               </button>
            </div>
         </div>
      </div>

      {/* Inline Notice Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[3rem] border-2 border-indigo-100 shadow-2xl overflow-hidden mb-12">
               <div className="p-6 sm:p-10 bg-slate-900 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                 <div className="flex justify-between items-center relative z-10">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-white/10">
                       <Zap size={24} />
                     </div>
                     <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase leading-none">
                       {isEditing ? "EDIT NOTICE" : "NEW NOTICE"}
                     </h2>
                   </div>
                   <button onClick={() => { setShowForm(false); resetForm(); }} className="p-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all">
                     <X size={24} />
                   </button>
                 </div>
               </div>

               <div className="p-8 sm:p-12 bg-slate-50">
                 <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Subject</label>
                           <input
                             type="text" name="title" required
                             placeholder="ENTER NOTICE TITLE..."
                             value={formData.title}
                             onChange={handleInputChange}
                             className="w-full bg-white border-2 border-slate-100 rounded-2xl px-8 py-5 text-sm font-black text-slate-900 focus:outline-none focus:border-indigo-500 transition-all italic uppercase"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Category</label>
                              <select
                                name="category" value={formData.category} onChange={handleInputChange}
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-[10px] font-black text-slate-900 focus:outline-none focus:border-indigo-500 transition-all uppercase tracking-widest cursor-pointer"
                              >
                                <option value="General">GENERAL</option>
                                <option value="Maintenance">MAINTENANCE</option>
                                <option value="Billing">BILLING</option>
                                <option value="Security">SECURITY</option>
                                <option value="Events">EVENTS</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Priority</label>
                              <select
                                name="priority" value={formData.priority} onChange={handleInputChange}
                                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-[10px] font-black text-slate-900 focus:outline-none focus:border-indigo-500 transition-all uppercase tracking-widest cursor-pointer"
                              >
                                <option value="low">LOW</option>
                                <option value="medium">NORMAL</option>
                                <option value="high">URGENT</option>
                              </select>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Notice Content</label>
                        <textarea
                          name="description" required
                          placeholder="BROADCAST DETAILS..."
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full h-full min-h-[200px] bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all resize-none italic leading-relaxed"
                        />
                     </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-6 pt-6 border-t border-slate-200">
                     <button
                       type="submit" disabled={isSubmitting}
                       className="flex-[2] py-6 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] italic hover:bg-indigo-600 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center text-center"
                     >
                       {isSubmitting ? "PROCESSING..." : (isEditing ? "UPDATE NOTICE" : "CREATE NOTICE")}
                     </button>
                     <button
                       type="button" onClick={() => { setShowForm(false); resetForm(); }}
                       className="flex-1 py-6 bg-white text-slate-400 rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] italic border-2 border-slate-100 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center text-center"
                     >
                       DISCARD
                     </button>
                   </div>
                 </form>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Utility Bar */}
      <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-200 shadow-xl p-4 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="FILTER ACTIVE LOGS..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] italic focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-4 px-6 border-l border-slate-100 hidden md:flex">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">ACTIVE NODES</span>
            <span className="text-[12px] font-black text-slate-900 uppercase italic">ONLINE</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>


      {/* Notices Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-10">
         <AnimatePresence mode="popLayout">
           {filteredNotices.length === 0 ? (
             <motion.div 
               key="empty-state"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="md:col-span-2 xl:col-span-3 bg-white rounded-[4rem] border border-slate-200 border-dashed py-32 text-center px-10 group"
             >
                <div className="inline-flex w-32 h-32 rounded-[3.5rem] bg-slate-50 items-center justify-center text-slate-200 mb-10 border border-slate-100 group-hover:bg-white group-hover:shadow-2xl transition-all duration-700">
                   <Megaphone size={64} strokeWidth={1} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Feed Clear: Zero Active Transmissions</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 italic px-4 max-w-sm mx-auto leading-relaxed">
                  No institutional notices match your current synchronization filters.
                </p>
             </motion.div>
           ) : (
             filteredNotices.map(notice => (
               <motion.div 
                 key={notice._id} 
                 layout
                 variants={ITEM_VARIANTS}
                 className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden group hover:shadow-3xl hover:border-indigo-100 transition-all duration-500 flex flex-col h-full"
               >
                  <div className={`h-1.5 w-full ${notice.priority === 'high' ? 'bg-rose-500' : 'bg-indigo-600'}`} />
                  
                  <div className="p-10 flex-1 flex flex-col">
                     <div className="flex items-center justify-between mb-8">
                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border italic shadow-sm flex items-center gap-2 ${
                          notice.priority === 'high' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${notice.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-current'}`} />
                           {notice.priority}
                        </div>
                        <span className="text-[10px] font-black text-slate-400 italic tabular-nums uppercase tracking-widest leading-none">
                           {new Date(notice.date).toLocaleDateString()}
                        </span>
                     </div>
                     
                     <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter group-hover:text-indigo-600 transition-colors uppercase leading-tight mb-4">
                        {notice.title}
                     </h3>
                     <p className="text-sm font-bold text-slate-500 leading-relaxed italic uppercase opacity-80 mb-10 flex-1 line-clamp-4 group-hover:line-clamp-none transition-all">
                        {notice.description}
                     </p>

                     <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => handleEdit(notice)}
                             className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-95 group/btn"
                           >
                              <Pencil size={18} />
                           </button>
                           <button 
                             onClick={() => handleDelete(notice._id)}
                             className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95 group/btn"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                        <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                           <ArrowRight size={20} strokeWidth={3} />
                        </div>
                     </div>
                  </div>
               </motion.div>
             ))
           )}
         </AnimatePresence>
      </div>

    </motion.div>
  );
}
