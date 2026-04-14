"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, Clock, CheckCircle2, 
  Trash2, UserPlus, Database, ShieldCheck, Zap,
  Sparkles, Maximize2, ArrowRight, Loader2, Calendar,
  Download, RotateCcw, Monitor, ShieldAlert, Camera
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    purpose: "",
    residentName: "",
    roomNumber: "",
    visitorImage: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchVisitors = async () => {
    if (!activeHostelId) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/visitors", { params: { hostelId: activeHostelId } });
      setVisitors(res.data || []);
    } catch (err) {
      addToast("Failed to sync security ledger.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVisitors(); }, [activeHostelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeHostelId) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/visitors", { ...formData, hostelId: activeHostelId });
      addToast("Security marker logged.", "success");
      setFormData({ name: "", mobile: "", purpose: "", residentName: "", roomNumber: "", visitorImage: "" });
      fetchVisitors();
    } catch (err) {
      addToast("Logging failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `visitor_photos/admin_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, visitorImage: url }));
      addToast("Asset captured.", "success");
    } catch (error) {
      addToast("Capture failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge entry from institutional records?")) return;
    try {
      await axios.delete(`/api/admin/visitors/${id}`);
      addToast("Marker purged.", "info");
      fetchVisitors();
    } catch (err) {
      addToast("Deletion request failed.", "error");
    }
  };

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => 
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.residentName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visitors, searchQuery]);

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
        <p className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-400 italic">Syncing Security Protocol Hub...</p>
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
      {/* Top Section: Hero & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <motion.div variants={ITEM_VARIANTS} className="lg:col-span-5 bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group shadow-3xl border border-white/5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full animate-pulse" />
            <div className="relative z-10 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8 group/avatar">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-[1.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
                       <UserPlus size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] italic leading-none">Security Core</span>
                       <h2 className="text-2xl font-black italic tracking-tighter mt-2 uppercase">IDENTITY LOG</h2>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white/10 transition-all" onClick={() => fileInputRef.current?.click()}>
                       {formData.visitorImage ? (
                         <img src={formData.visitorImage} className="w-full h-full object-cover" />
                       ) : isUploading ? (
                         <Loader2 className="animate-spin text-white/40" size={18} />
                       ) : (
                         <Camera className="text-white/20" size={18} />
                       )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>
               </div>
               <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                     <input 
                       type="text" placeholder="ENTITY NAME" required
                       value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest placeholder:text-white/20 focus:bg-white/10 focus:ring-0 transition-all italic text-white"
                     />
                     <input 
                       type="text" placeholder="MOBILE VECTOR" required
                       value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest placeholder:text-white/20 focus:bg-white/10 focus:ring-0 transition-all italic text-white"
                     />
                  </div>
                  <input 
                    type="text" placeholder="OBJECTIVE PURPOSE" required
                    value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest placeholder:text-white/20 focus:bg-white/10 focus:ring-0 transition-all italic text-white"
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <input 
                       type="text" placeholder="RESIDENT LINK" required
                       value={formData.residentName} onChange={(e) => setFormData({...formData, residentName: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest placeholder:text-white/20 focus:bg-white/10 focus:ring-0 transition-all italic text-white"
                     />
                     <input 
                       type="text" placeholder="NODE #" required
                       value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest placeholder:text-white/20 focus:bg-white/10 focus:ring-0 transition-all italic text-white"
                     />
                  </div>
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full py-5 rounded-[1.8rem] bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-500/20 disabled:opacity-50 italic mt-6"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "INITIATE ENTRY LOG"} <Zap size={16} className="fill-white" />
                  </button>
               </form>
            </div>
         </motion.div>

         <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { label: "Temporal Entries", value: visitors.length, icon: Users, color: "bg-indigo-600" },
              { label: "Spatial Access Active", value: new Set(visitors.map(v => v.roomNumber)).size, icon: Monitor, color: "bg-slate-900" },
              { label: "Integrity Checks", value: "Verified", icon: ShieldCheck, color: "bg-emerald-600" },
              { label: "Security Status", value: "Locked", icon: ShieldAlert, color: "bg-rose-600" }
            ].map((stat, i) => (
              <motion.div key={i} variants={ITEM_VARIANTS} className="premium-glass p-10 rounded-[2.5rem] border border-slate-200/60 flex flex-col justify-between hover:shadow-2xl transition-all shadow-sm relative overflow-hidden group">
                 <div className={`absolute -right-8 -top-8 w-32 h-32 ${stat.color} opacity-5 rounded-full`} />
                 <div className={`w-14 h-14 rounded-[1.5rem] ${stat.color} bg-opacity-10 flex items-center justify-center text-slate-900 border border-white/20 shadow-inner italic transition-transform group-hover:scale-110`}>
                    <stat.icon size={28} className={stat.color.replace('bg-', 'text-')} />
                 </div>
                 <div className="mt-10">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">{stat.label}</p>
                    <p className="text-4xl font-black text-slate-900 italic tracking-tighter mt-3">{stat.value}</p>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-xl">
         <div className="relative group flex-1">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search Security Ledger ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-4 bg-transparent border-none focus:ring-0 text-[12px] font-black uppercase tracking-widest text-slate-700 placeholder:text-slate-300 italic"
            />
         </div>
         <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
         <button className="flex items-center gap-3 px-10 py-4 bg-slate-50 text-slate-500 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all italic border border-slate-200 shadow-sm">
            LEDGER AUDIT <Calendar size={16} />
         </button>
      </div>

      {/* Ledger Table Section */}
      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden p-2">
         <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[1100px]">
               <thead>
                  <tr className="bg-slate-50/50">
                     {[
                       "Resident Identity", "Spatial Node", "Temporal In", "Temporal Out", "Visual ID", "Ops"
                     ].map((h, i) => (
                       <th key={i} className={`px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic ${h === 'Ops' ? 'text-right' : ''}`}>{h}</th>
                     ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredVisitors.length === 0 ? (
                      <tr>
                         <td colSpan={6} className="py-48 text-center opacity-20">
                            <Database size={80} className="mx-auto mb-8 text-slate-400" />
                            <p className="font-black uppercase tracking-[0.5em] text-[14px] text-slate-400 italic">No Synchronization Markers Match Filters</p>
                         </td>
                      </tr>
                    ) : (
                      filteredVisitors.map((v, i) => (
                        <motion.tr 
                          key={v.id || i} 
                          variants={ITEM_VARIANTS}
                          className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                        >
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-[1.2rem] overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-black italic border border-slate-100 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                                    {v.visitorImage ? (
                                      <img src={v.visitorImage} alt={v.name} className="w-full h-full object-cover" />
                                    ) : (
                                      v.name?.[0]
                                    )}
                                 </div>
                                 <div className="flex flex-col">
                                    <p className="text-base font-black text-slate-900 uppercase tracking-tight italic group-hover:text-indigo-600 transition-colors">{v.name}</p>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 leading-none">{v.mobile}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[13px] font-black text-slate-600 uppercase italic leading-none">{v.residentName}</span>
                           </td>
                           <td className="px-10 py-8">
                              <span className="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200 italic shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-100 transition-all">NODE {v.roomNumber}</span>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[12px] font-black text-slate-400 italic tabular-nums">{new Date(v.entryDate || v.createdAt).toLocaleTimeString()}</span>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[12px] font-black text-slate-400 italic tabular-nums opacity-40">—</span>
                           </td>
                           <td className="px-10 py-8">
                              <button 
                                onClick={() => handleDelete(v.id)}
                                className="p-4 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100 shadow-sm active:scale-90"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
               </tbody>
            </table>
         </div>
      </div>
    </motion.div>
  );
}
