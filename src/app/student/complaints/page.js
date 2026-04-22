"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useComplaints } from "@/hooks/useComplaints";
import { 
  Loader2, MessageSquare, Send, Clock, CheckCircle, 
  AlertCircle, ShieldAlert, Zap, Info, ChevronDown, 
  ChevronUp, Camera, History, Tag, User, MapPin, X,
  Plus, Sparkles, Database, Filter, ArrowRight
} from "lucide-react";

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
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const VisualTimeline = ({ status }) => {
  const stages = [
    { id: 'Pending', label: 'Registered', icon: Send, color: 'indigo' },
    { id: 'In-Progress', label: 'In Progress', icon: Zap, color: 'amber' },
    { id: 'Resolved', label: 'Resolved', icon: CheckCircle, color: 'emerald' },
    { id: 'Closed', label: 'Closed', icon: CheckCircle, color: 'slate' },
  ];
  
  const currentIdx = stages.findIndex(s => s.id === status);
  const progress = (currentIdx / (stages.length - 1)) * 100;

  return (
    <div className="relative pt-12 pb-12 px-4">
      {/* Background Line */}
      <div className="absolute top-[3.75rem] left-8 right-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "circOut" }}
        />
      </div>

      <div className="flex justify-between items-start relative z-10">
        {stages.map((stage, idx) => {
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="flex flex-col items-center gap-4">
              <motion.div 
                animate={{ 
                  scale: isCurrent ? 1.25 : 1,
                  backgroundColor: isCurrent ? '#4f46e5' : isActive ? '#ffffff' : '#f8fafc',
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-colors duration-500 shadow-xl ${
                  isCurrent ? 'border-indigo-600 shadow-indigo-200/50 text-white' :
                  isActive ? 'border-indigo-500 text-indigo-500 shadow-indigo-100/20' : 
                  'border-slate-200 text-slate-300'
                }`}
              >
                <Icon size={18} strokeWidth={2.5} />
              </motion.div>
              <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 leading-none ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {stage.label}
                </p>
                {isCurrent && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[8px] font-bold text-indigo-600 italic uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full"
                  >
                    Active
                  </motion.span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function StudentComplaintsPage() {
  const { user, userData } = useAuth();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [filter, setFilter] = useState("All");
  
  const [form, setForm] = useState({ 
    subject: "", 
    description: "", 
    priority: "Normal", 
    category: "Maintenance" 
  });

  const categories = ["Maintenance", "Internet", "Cleaning", "Security", "Roommate", "Furniture", "Other"];
  const priorities = ["Normal", "Urgent", "Emergency"];

  const { data: complaints = [], isLoading: loading, refetch: refetchComplaints } = useComplaints({ studentId: (user?._id || user?.id || user?.uid) });

  const fetchRoomNumber = useCallback(async () => {
    if (!(user?._id || user?.id || user?.uid) || !userData?.hostelId) return;
    try {
      const profileInfo = userData; // Directly use userData from context
      if (profileInfo?.assignedRoomId) {
        const roomRes = await axios.get(`/api/rooms/${profileInfo.assignedRoomId}`, { params: { hostelId: userData.hostelId } });
        setRoomNumber(roomRes.data?.roomNumber || "");
      }
    } catch (error) {
      console.error(error);
    }
  }, [user, userData]);

  useEffect(() => { fetchRoomNumber(); }, [fetchRoomNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) { addToast("Identity failure: Missing mandatory fields.", "error"); return; }
    setSubmitting(true);
    try {
      await axios.post("/api/complaints", { 
        ...form, 
        studentId: (user?._id || user?.id || user?.uid), 
        studentName: userData?.name || user?.email?.split("@")[0], 
        roomNumber: roomNumber || userData.roomNumber || "Unassigned",
        hostelId: userData.hostelId 
      });
      setForm({ subject: "", description: "", priority: "Normal", category: "Maintenance" });
      setShowForm(false);
      addToast("Ticket successfully synchronized with resolution hub.", "success");
      refetchComplaints();
    } catch (error) {
      addToast("Encrypted link failure. Transmission aborted.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    if (filter === "All") return complaints;
    return complaints.filter(c => (c.status || "").toLowerCase() === filter.toLowerCase());
  }, [complaints, filter]);

  if (loading && complaints.length === 0) {
    return (
      <div className="p-4 sm:p-8 space-y-12 sm:space-y-16 min-h-screen max-w-7xl mx-auto pb-32 animate-pulse">
        {/* Skeleton Header Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
           <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                 <div className="space-y-3">
                    <div className="w-32 h-4 bg-slate-100 rounded" />
                    <div className="w-64 h-10 bg-slate-100 rounded" />
                 </div>
              </div>
              <div className="w-full max-w-xl h-16 bg-slate-100 rounded" />
           </div>
           <div className="lg:col-span-4 rounded-[2rem] bg-slate-100 h-20 w-full" />
        </div>
        
        {/* Skeleton Reports Logic */}
        <div className="max-w-4xl mx-auto space-y-8 mt-12">
           {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-[3.5rem] w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={CONTAINER_VARIANTS}
      className="p-4 sm:p-8 space-y-12 sm:space-y-16 min-h-screen max-w-7xl mx-auto pb-32"
    >
      
      {/* Header & Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-8">
           <div className="flex items-center gap-4 mb-6">
             <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-3xl shadow-indigo-100 rotate-3 group-hover:rotate-0 transition-transform">
               <ShieldAlert size={32} strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic leading-none block mb-2">Institutional Node</span>
                <h1 className="text-4xl sm:text-6xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">HELP <span className="text-indigo-600 not-italic">DESK</span></h1>
             </div>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] italic max-w-xl leading-relaxed">
             Direct neural link to facility maintenance and administrative support. 
             Status tracking enabled for all active incident markers.
           </p>

        </motion.div>
        
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-4">
           <button
             onClick={() => setShowForm(!showForm)}
             className={`w-full group relative overflow-hidden flex items-center justify-center gap-5 px-10 py-7 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-3xl ${
               showForm 
                 ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-100/20' 
                 : 'bg-slate-900 text-white shadow-slate-900/20'
             }`}
           >
             <div className={`absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity ${showForm ? 'bg-rose-500' : 'bg-indigo-500'}`} />
             {showForm ? <X size={22} /> : <Plus size={22} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />} 
             <span className="relative z-10 italic">{showForm ? "ABORT REQUEST" : "INITIATE TICKET"}</span>
           </button>
        </motion.div>

      </div>

      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[3rem] sm:rounded-[4rem] border border-slate-200 shadow-3xl p-8 sm:p-16 max-w-4xl mx-auto relative group/form">
               <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-0 group-hover/form:opacity-100 transition-opacity">
                  <Sparkles size={80} strokeWidth={1} />
               </div>
               
               <div className="flex items-center gap-6 mb-12 sm:mb-16">
                  <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 group-hover/form:-rotate-6 transition-all duration-500">
                     <MessageSquare size={32} />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">INCIDENT DATA</h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">Establishing context for resolution hub...</p>
                  </div>
               </div>

               <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2 italic">
                           <Info size={14} className="text-indigo-600" /> SUBJECT CONTEXT
                        </label>
                        <input 
                          type="text" placeholder="Short Identifier..." value={form.subject} 
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.8rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 italic uppercase" 
                        />
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2 italic">
                           <Tag size={14} className="text-indigo-600" /> CATEGORY CLASSIFIER
                        </label>
                        <div className="relative">
                           <select 
                             value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                             className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.8rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer italic uppercase"
                           >
                             {categories.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                           <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2 italic">
                        <Database size={14} className="text-indigo-600" /> DETAILED LOGISTICS
                     </label>
                     <textarea 
                       rows={5} placeholder="Describe exact coordinates and neural triggers of the incident..." 
                       value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                       className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none placeholder:text-slate-300 italic uppercase" 
                     />
                  </div>

                  <div className="flex flex-col xl:flex-row items-center justify-between gap-10 pt-8 border-t border-slate-100">
                     <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic whitespace-nowrap">PRIORITY VECTOR:</span>
                        <div className="flex gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                          {priorities.map(p => (
                            <button 
                              key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 ${
                                form.priority === p 
                                  ? p === 'Emergency' ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' :
                                     p === 'Urgent' ? 'bg-amber-400 text-white shadow-xl shadow-amber-100' :
                                     'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                                  : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-500 border border-slate-200'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                     </div>
                     <button 
                       type="submit" disabled={submitting}
                       className="w-full xl:w-auto px-16 py-6 bg-indigo-600 text-white font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-indigo-700 transition-all active:scale-95 shadow-3xl shadow-indigo-200 flex items-center justify-center gap-5 text-sm italic"
                     >
                       {submitting ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} strokeWidth={3} />}
                       SYNC REPORT
                     </button>
                  </div>
               </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar for List */}
      <motion.div variants={ITEM_VARIANTS} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-[3rem] border border-slate-200 shadow-2xl max-w-4xl mx-auto">
         <div className="flex items-center gap-2 pl-6 text-slate-400">
            <Filter size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest italic mr-4">Status Filter</span>
         </div>
         <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-[2.5rem] w-full sm:w-auto flex-1">
            {["All", "Pending", "In-Progress", "Resolved", "Closed"].map(s => (
              <button 
                key={s} onClick={() => setFilter(s)}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-[2rem] text-[9px] font-black uppercase tracking-widest transition-all ${
                  filter === s ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s === 'Pending' ? 'Open' : s === 'In-Progress' ? 'Work' : s}
              </button>
            ))}
         </div>
      </motion.div>

      {/* Incident Ledger */}
      <div className="max-w-4xl mx-auto space-y-8">
         <AnimatePresence mode="popLayout">
           {filteredComplaints.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[4rem] border border-slate-200 border-dashed py-32 sm:py-48 text-center px-10 group"
             >
                <div className="inline-flex w-32 h-32 rounded-[3.5rem] bg-slate-50 items-center justify-center text-slate-200 mb-10 border border-slate-100 group-hover:scale-110 group-hover:bg-white group-hover:shadow-2xl transition-all duration-700">
                   <History size={64} strokeWidth={1} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Ledger Integrity: Zero Markers</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 italic px-4 max-w-sm mx-auto leading-relaxed">
                  Systems running at 100% capacity. No active incident reports detected in your sector.
                </p>
             </motion.div>
           ) : (
             filteredComplaints.map(complaint => (
               <motion.div 
                 key={complaint._id} 
                 layout
                 variants={ITEM_VARIANTS}
                 className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden group hover:shadow-3xl hover:border-indigo-100 transition-all duration-500"
               >
                  <button 
                    onClick={() => setExpandedId(expandedId === complaint._id ? null : complaint._id)} 
                    className="w-full p-8 sm:p-12 text-left relative"
                  >
                     <div className="flex flex-col sm:flex-row gap-8 justify-between items-start">
                        <div className="flex items-center gap-8 w-full">
                           <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] flex items-center justify-center italic text-2xl sm:text-3xl font-black shadow-inner border shrink-0 transition-transform group-hover:rotate-12 duration-500 ${
                              complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                              complaint.status === 'In Progress' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                              'bg-indigo-50 text-indigo-500 border-indigo-100'
                           }`}>
                              {complaint.category?.[0] || "?"}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-4 mb-2">
                                 <h3 className="text-xl sm:text-2xl font-black text-slate-900 italic tracking-tighter group-hover:text-indigo-600 transition-colors uppercase truncate leading-none">
                                    {complaint.subject}
                                 </h3>
                                 <div className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block ${expandedId === complaint._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {expandedId === complaint._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                 </div>
                              </div>
                              <div className="flex items-center flex-wrap gap-4 sm:gap-6 mt-4">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                                   <Tag size={14} strokeWidth={2.5} className="text-indigo-500" /> {complaint.category}
                                 </span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                                   <Clock size={14} strokeWidth={2.5} className="text-indigo-500" /> {new Date(complaint.createdAt).toLocaleDateString()}
                                 </span>
                                 <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center gap-2 italic ${
                                   complaint.priority === 'Emergency' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                   complaint.priority === 'Urgent' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                   'bg-indigo-50 text-indigo-500 border-indigo-100'
                                 }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${complaint.priority === 'Emergency' ? 'bg-rose-500 animate-ping' : 'bg-current'}`} />
                                    {complaint.priority}
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] border shadow-xl text-center italic transition-all group-hover:scale-105 ${
                          complaint.status === 'Resolved' ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-100' :
                          complaint.status === 'In-Progress' ? 'bg-amber-500 text-white border-amber-400 shadow-amber-100' :
                          complaint.status === 'Closed' ? 'bg-slate-500 text-white border-slate-400 shadow-slate-100' :
                          'bg-indigo-600 text-white border-indigo-500 shadow-indigo-100'
                        }`}>
                           {complaint.status === 'Pending' ? 'Open' : complaint.status}
                        </div>
                     </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === complaint._id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-8 sm:px-12 pb-12 sm:pb-16 pt-6 border-t border-slate-100 bg-slate-50/30"
                      >
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
                            <div className="space-y-10">
                               <motion.div 
                                 initial={{ x: -20, opacity: 0 }}
                                 animate={{ x: 0, opacity: 1 }}
                                 transition={{ delay: 0.1 }}
                               >
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3 italic">
                                    <MapPin size={16} className="text-indigo-500" /> INCIDENT ANALYTICS
                                  </p>
                                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group/card">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                     <p className="text-sm font-bold text-slate-800 leading-relaxed italic uppercase relative z-10">{complaint.description}</p>
                                  </div>
                               </motion.div>

                               {complaint.response && (
                                 <motion.div 
                                   initial={{ x: -20, opacity: 0 }}
                                   animate={{ x: 0, opacity: 1 }}
                                   transition={{ delay: 0.2 }}
                                 >
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-3 italic">
                                      <History size={16} /> ADMIN RESPONSE LOG
                                    </p>
                                    <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-100 group/resp relative">
                                       <div className="absolute top-4 right-8 opacity-20"><ArrowRight size={48} rotate={45} /></div>
                                       <p className="text-sm font-black leading-relaxed uppercase italic relative z-10">{complaint.response}</p>
                                       <div className="mt-6 flex items-center gap-3">
                                          <div className="w-6 h-6 rounded-full bg-white/20" />
                                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Management Verified</span>
                                       </div>
                                    </div>
                                 </motion.div>
                               )}
                            </div>
                            
                            <motion.div 
                               initial={{ scale: 0.9, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               transition={{ delay: 0.3 }}
                               className="bg-white p-8 sm:p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col justify-center"
                            >
                               <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500/10" />
                               <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4 text-center italic">Service Lifecycle Graph</p>
                               <VisualTimeline status={complaint.status} />
                               
                               <div className="mt-8 flex items-center justify-center gap-4 text-slate-300">
                                  <div className="w-12 h-[1px] bg-current" />
                                  <span className="text-[8px] font-black uppercase tracking-[0.4em]">Audit Trail Active</span>
                                  <div className="w-12 h-[1px] bg-current" />
                               </div>
                            </motion.div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </motion.div>
             ))
           )}
         </AnimatePresence>
      </div>
    </motion.div>
  );
}
