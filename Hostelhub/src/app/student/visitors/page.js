"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { 
  Users, UserPlus, Clock, History, Search, 
  Filter, Zap, ShieldCheck, ShieldAlert, 
  Trash2, Plus, X, Camera, Loader2, 
  MessageSquare, Calendar, ChevronRight,
  Database, Sparkles, MapPin, Phone,
  User as UserIcon, Building2, Inbox
} from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

const MODAL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export default function StudentVisitorsPage() {
  const { user, userData } = useAuth();
  const { addToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    purpose: "Personal",
    visitorImage: ""
  });

  const fetchData = async () => {
    if (!user?.uid || !userData?.hostelId) return;
    setLoading(true);
    try {
      const histRes = await axios.get(`/api/visitors`, { 
        params: { 
          hostStudentId: user.uid, 
          hostelId: userData.hostelId 
        } 
      });
      setHistory(histRes.data || []);
    } catch (err) {
      addToast("Failed to sync security ledger.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, userData]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { addToast("Asset oversized. Limit: 2MB", "error"); return; }
    
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `visitor_photos/${user.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm(prev => ({ ...prev, visitorImage: url }));
      addToast("Identity marker captured.", "success");
    } catch (error) {
      addToast("Upload uplink failure.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile) { addToast("Identity failure: Missing mandatory fields.", "error"); return; }
    setIsSubmitting(true);
    try {
      await axios.post("/api/visitors", { 
        ...form, 
        hostStudentId: user.uid,
        studentName: userData.name || user.email.split("@")[0],
        roomNo: userData.roomNumber || "Unassigned",
        hostelId: userData.hostelId 
      });
      addToast("Security marker initiated successfully.", "success");
      setForm({ name: "", mobile: "", purpose: "Personal", visitorImage: "" });
      setShowModal(false);
      fetchData();
    } catch (error) {
      addToast("Failed to transmit logs.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-[6px] border-slate-900/10 border-t-indigo-600 rounded-full" 
        />
        <p className="font-black uppercase tracking-[0.4em] text-[10px] text-slate-400 italic">Syncing Security Protocol Hub...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={CONTAINER_VARIANTS}
      className="p-4 sm:p-8 space-y-12 sm:space-y-16 max-w-7xl mx-auto pb-32"
    >
      
      {/* Header & Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-8">
           <div className="flex items-center gap-4 mb-6">
             <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
               <ShieldCheck size={28} strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic leading-none">Access Control</span>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 italic tracking-tighter mt-2 uppercase leading-none">Security Hub</h1>
             </div>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] italic max-w-xl leading-relaxed">
             Autonomous visitor registration & security ledger synchronization. 
             All entries are verified against institutional identity protocols.
           </p>
        </motion.div>
        
        <motion.div variants={ITEM_VARIANTS} className="lg:col-span-4">
           <button
             onClick={() => setShowModal(true)}
             className="w-full group relative overflow-hidden flex items-center justify-center gap-4 px-10 py-6 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.4em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl shadow-slate-900/10"
           >
             <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
             <Plus size={20} strokeWidth={3} className="relative z-10" /> 
             <span className="relative z-10">INITIATE ACCESS LOG</span>
           </button>
        </motion.div>
      </div>

      {/* Stats Layer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
         {[
           { label: "Temporal Entries", value: history.length, color: "bg-indigo-600", icon: Users },
           { label: "Active Access", value: history.filter(h => h.status === 'Inside').length, color: "bg-emerald-600", icon: Zap },
           { label: "Node Identifier", value: userData?.roomNumber || "Unassigned", color: "bg-slate-900", icon: Building2 },
           { label: "Security Status", value: "Verified", color: "bg-indigo-600", icon: ShieldCheck }
         ].map((stat, i) => (
           <motion.div key={i} variants={ITEM_VARIANTS} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
              <div className={`absolute -right-6 -top-6 w-24 h-24 ${stat.color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`} />
              <div className={`w-12 h-12 rounded-2xl ${stat.color} bg-opacity-10 flex items-center justify-center mb-8`}>
                 <stat.icon size={24} className={stat.color.replace('bg-', 'text-')} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 italic">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{stat.value}</p>
           </motion.div>
         ))}
      </div>

      {/* Main Ledger */}
      <div className="space-y-8">
         <motion.div variants={ITEM_VARIANTS} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden p-2">
            <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[1000px]">
                  <thead>
                     <tr className="bg-slate-50/50">
                        {["Identity Fragment", "Purpose Vector", "Temporal In", "Temporal Out", "Status Audit"].map((h, i) => (
                          <th key={i} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">{h}</th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     <AnimatePresence mode="popLayout">
                        {history.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="py-48 text-center bg-white">
                                 <div className="inline-flex w-32 h-32 rounded-[3.5rem] bg-slate-50 items-center justify-center text-slate-200 mb-10 border border-slate-100 italic">
                                    <Inbox size={64} strokeWidth={1} />
                                 </div>
                                 <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">No Security Markers Found</h3>
                                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 italic">Synchronized ledger shows zero historical access logs.</p>
                              </td>
                           </tr>
                        ) : (
                           history.map(item => (
                              <motion.tr 
                                key={item.id} 
                                layout
                                variants={ITEM_VARIANTS}
                                className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                              >
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-6">
                                       <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 text-lg font-black italic border border-slate-200 shrink-0 group-hover:rotate-6 transition-transform">
                                          {item.visitorImage ? (
                                            <img src={item.visitorImage} alt={item.name} className="w-full h-full object-cover" />
                                          ) : (
                                            item.name?.[0]
                                          )}
                                       </div>
                                       <div>
                                          <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors leading-none">{item.name}</p>
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{item.mobile || item.phone}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    <span className="text-[12px] font-black text-slate-600 uppercase italic leading-none">{item.purpose}</span>
                                 </td>
                                 <td className="px-10 py-8">
                                    <span className="text-[12px] font-black text-slate-400 italic tabular-nums">
                                      {new Date(item.checkIn || item.createdAt).toLocaleTimeString()}
                                    </span>
                                 </td>
                                 <td className="px-10 py-8">
                                    <span className="text-[12px] font-black text-slate-400 italic tabular-nums">
                                      {item.checkOut ? new Date(item.checkOut).toLocaleTimeString() : "--:--:--"}
                                    </span>
                                 </td>
                                 <td className="px-10 py-8">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic border ${
                                      item.status === 'Departed' ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}>
                                       <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Departed' ? 'bg-slate-300' : 'bg-emerald-500 animate-pulse'}`} />
                                       {item.status || "Inside"}
                                    </div>
                                 </td>
                              </motion.tr>
                           ))
                        )}
                     </AnimatePresence>
                  </tbody>
               </table>
            </div>
         </motion.div>
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
         {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl">
               <motion.div 
                 initial="hidden" animate="visible" exit="exit" variants={MODAL_VARIANTS}
                 className="bg-white w-full max-w-xl rounded-[3rem] border border-slate-200 shadow-3xl p-10 sm:p-14 relative group/modal overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-12 text-slate-50 pointer-events-none group-hover/modal:text-indigo-50 transition-colors duration-700">
                     <Sparkles size={80} strokeWidth={1} />
                  </div>
                  
                  <button 
                    onClick={() => setShowModal(false)}
                    className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
                  >
                     <X size={20} />
                  </button>

                  <div className="flex items-center gap-6 mb-12 sm:mb-16 relative z-10">
                     <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 -rotate-3 group-hover/modal:rotate-0 transition-all duration-500">
                        <UserPlus size={32} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Security Log</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">Establishing identity logs for nodal access...</p>
                     </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                     <div className="flex justify-center mb-8">
                        <div className="relative group/avatar">
                           <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-slate-100 shadow-inner flex items-center justify-center overflow-hidden transition-all group-hover/avatar:border-indigo-100">
                              {form.visitorImage ? (
                                <img src={form.visitorImage} alt="Visitor Preview" className="w-full h-full object-cover" />
                              ) : isUploading ? (
                                <Loader2 className="animate-spin text-indigo-400" size={32} />
                              ) : (
                                <Camera size={32} className="text-slate-300 group-hover/avatar:scale-110 transition-transform" />
                              )}
                           </div>
                           <button 
                             type="button" onClick={() => fileInputRef.current?.click()}
                             className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center text-indigo-600 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                           >
                              <Plus size={24} />
                           </button>
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Entity Username</label>
                        <input 
                           type="text" placeholder="Full Legal Name..." required
                           value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                           className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.8rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 italic uppercase"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Mobile Vector</label>
                           <input 
                              type="text" placeholder="+91 XXXXX XXXXX" required
                              value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})}
                              className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.8rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 italic uppercase"
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic">Objective</label>
                           <select 
                              value={form.purpose} onChange={(e) => setForm({...form, purpose: e.target.value})}
                              className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[1.8rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer italic uppercase"
                           >
                              <option value="Personal">Personal</option>
                              <option value="Official">Official</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Delivery">Delivery</option>
                              <option value="Guardian">Guardian</option>
                           </select>
                        </div>
                     </div>

                     <button 
                        type="submit" disabled={isSubmitting || isUploading}
                        className="w-full py-6 bg-slate-900 text-white font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-5 italic text-xs mt-4 disabled:grayscale"
                     >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} strokeWidth={3} />}
                        VERIFY & SYNC LOG
                     </button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </motion.div>
  );
}
