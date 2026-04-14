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

export default function AdminNoticesPage() {
  const { addToast } = useToast();
  const { activeHostelId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    priority: "normal"
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
        await axios.put(`/api/notices/${formData.id}`, payload);
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
      id: null,
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      priority: "normal"
    });
    setIsEditing(false);
  };

  const handleEdit = (notice) => {
    setFormData({
      id: notice.id,
      title: notice.title,
      description: notice.description,
      date: notice.date ? notice.date.split("T")[0] : "",
      priority: notice.priority
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
      <div className="flex flex-col items-center justify-center py-48 gap-8">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-[6px] border-indigo-600/10 border-t-indigo-600 rounded-full" 
          />
          <Megaphone className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={24} />
        </div>
        <p className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-400 italic">Synchronizing Institutional Node Feed...</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-8">
           <div className="flex items-center gap-4 mb-6">
             <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200">
               <Bell size={28} strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic leading-none">Newsfeed Terminal</span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 italic tracking-tighter mt-2 uppercase leading-none">Notice Board</h1>
             </div>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] italic max-w-xl leading-relaxed">
             Propagating institutional protocols and administrative broadcasts across the resident cluster network.
           </p>
        </motion.div>
        
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-4 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" placeholder="FILTER LOGS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] italic focus:ring-4 focus:ring-indigo-500/5 shadow-sm transition-all"
              />
           </div>
           <button
             onClick={() => {
                if (isEditing) resetForm();
                setShowForm(!showForm);
             }}
             className={`px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl flex items-center justify-center gap-3 italic ${
               showForm 
                 ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                 : 'bg-slate-900 text-white shadow-slate-900/10'
             }`}
           >
             {showForm ? <X size={18} /> : <Plus size={18} strokeWidth={3} />} 
             {showForm ? "ABORT" : "NEW BROADCAST"}
           </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[3rem] sm:rounded-[4rem] border border-slate-200 shadow-3xl p-8 sm:p-16 max-w-4xl mx-auto relative group/form overflow-hidden mb-12">
               <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-10 pointer-events-none">
                  <Megaphone size={120} strokeWidth={0.5} />
               </div>
               
               <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 transition-all duration-500">
                     <Plus size={32} />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                        {isEditing ? "MODIFY MARKER" : "INITIATE PROPAGATION"}
                     </h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">Defining institutional protocol parameters...</p>
                  </div>
               </div>

               <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Title / Objective</label>
                        <input 
                          type="text" name="title" required value={formData.title} onChange={handleInputChange}
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.8rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 italic uppercase"
                          placeholder="Announement context..." 
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Temporal Root</label>
                           <input 
                              type="date" name="date" required value={formData.date} onChange={handleInputChange}
                              className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all italic"
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Severity</label>
                           <select 
                             name="priority" value={formData.priority} onChange={handleInputChange}
                             className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-[10px] font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer italic uppercase"
                           >
                              <option value="normal">NORMAL</option>
                              <option value="important">URGENT</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Narrative Payload</label>
                     <textarea 
                       name="description" required rows={5} value={formData.description} onChange={handleInputChange}
                       className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none placeholder:text-slate-300 italic uppercase"
                       placeholder="Define the institutional broadcast message..." 
                     />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-10 pt-8 border-t border-slate-100">
                     <div className="flex items-center gap-4 text-slate-300 italic">
                        <ShieldCheck size={20} className="text-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Institutional Verification Active</span>
                     </div>
                     <button 
                       type="submit" disabled={isSubmitting}
                       className="w-full sm:w-auto px-16 py-6 bg-slate-900 text-white font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-indigo-600 transition-all active:scale-95 shadow-3xl shadow-slate-900/10 flex items-center justify-center gap-5 text-sm italic"
                     >
                       {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} strokeWidth={3} className="fill-white" />}
                       {isEditing ? "UPDATE BROADCAST" : "SEND PROTOCOL"}
                     </button>
                  </div>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notices Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 sm:gap-10">
         <AnimatePresence mode="popLayout">
           {filteredNotices.length === 0 ? (
             <motion.div 
               colSpan={3}
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
                 key={notice.id} 
                 layout
                 variants={ITEM_VARIANTS}
                 className="bg-white rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden group hover:shadow-3xl hover:border-indigo-100 transition-all duration-500 flex flex-col h-full"
               >
                  <div className={`h-1.5 w-full ${notice.priority === 'important' ? 'bg-rose-500' : 'bg-indigo-600'}`} />
                  
                  <div className="p-10 flex-1 flex flex-col">
                     <div className="flex items-center justify-between mb-8">
                        <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border italic shadow-sm flex items-center gap-2 ${
                          notice.priority === 'important' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${notice.priority === 'important' ? 'bg-rose-500 animate-pulse' : 'bg-current'}`} />
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
                             onClick={() => handleDelete(notice.id)}
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
