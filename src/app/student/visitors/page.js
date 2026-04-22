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
  User as UserIcon, Building2, Inbox, Edit3,
  Timer, AlertCircle, CheckCircle2, RotateCcw
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
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

const MODAL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 }
};



export default function StudentVisitorsPage() {
  const { user, userData } = useAuth();
  const { addToast } = useToast();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10s
    return () => clearInterval(timer);
  }, []);
  const fileInputRef = useRef(null);

  const initialForm = {
    visitorName: "",
    visitorPhone: "",
    relation: "Parent",
    purpose: "Personal",
    visitDate: new Date().toISOString().split('T')[0],
    visitStartTime: "10:00",
    visitEndTime: "11:00",
    visitorImage: "",
    notes: ""
  };

  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    const studentId = user?._id || user?.id || user?.uid;
    if (!studentId || !userData?.hostelId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/visitors`, { 
        params: { 
          studentId, 
          hostelId: userData.hostelId 
        } 
      });
      setVisitors(res.data || []);
    } catch (err) {
      addToast("Failed to sync security ledger.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user, userData]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { addToast("Asset oversized. Limit: 2MB", "error"); return; }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "visitor_photos");
      const { data } = await axios.post("/api/upload", formData);
      setForm(prev => ({ ...prev, visitorImage: data.url }));
      addToast("Identity marker captured.", "success");
    } catch (error) {
      addToast("Upload uplink failure.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const studentId = user?._id || user?.id || user?.uid;
    if (!form.visitorName || !form.visitorPhone) { 
      addToast("Identity failure: Missing mandatory fields.", "error"); 
      return; 
    }
    
    setIsSubmitting(true);
    try {
      // Calculate duration in minutes
      const [h1, m1] = form.visitStartTime.split(':').map(Number);
      const [h2, m2] = form.visitEndTime.split(':').map(Number);
      let duration = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (duration < 0) duration += 24 * 60; // Next day fallback

      const payload = {
        ...form,
        visitTime: form.visitStartTime,
        expectedDuration: duration,
        studentId,
        studentName: userData.name || user.email.split("@")[0],
        roomNo: userData.roomNumber || "Unassigned",
        hostelId: userData.hostelId
      };

      if (editingId) {
        await axios.put(`/api/visitors/${editingId}`, payload);
        addToast("Security request updated.", "success");
      } else {
        await axios.post("/api/visitors", payload);
        addToast("Security marker initiated successfully.", "success");
      }

      setForm(initialForm);
      setEditingId(null);
      setShowModal(false);
      fetchData();
    } catch (error) {
      addToast("Failed to transmit logs.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (visitor) => {
    if (visitor.status !== 'Pending') {
      addToast("Validated logs cannot be edited.", "warning");
      return;
    }
    const startTime = visitor.visitTime || "10:00";
    const duration = visitor.expectedDuration || 60;
    
    // Calculate end time
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + duration;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    const endTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;

    setForm({
      visitorName: visitor.visitorName || "",
      visitorPhone: visitor.visitorPhone || "",
      relation: visitor.relation || "Parent",
      purpose: visitor.purpose || "Personal",
      visitDate: visitor.visitDate ? new Date(visitor.visitDate).toISOString().split('T')[0] : initialForm.visitDate,
      visitStartTime: startTime,
      visitEndTime: endTime,
      visitorImage: visitor.visitorImage || "",
      notes: visitor.notes || ""
    });
    setEditingId(visitor._id);
    setShowModal(true);
  };

  if (loading && visitors.length === 0) {
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
      initial="hidden" animate="visible" variants={CONTAINER_VARIANTS}
      className="p-4 sm:p-8 space-y-12 sm:space-y-16 max-w-7xl mx-auto pb-32"
    >
      
      {/* Header */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12 items-end">
        <motion.div variants={ITEM_VARIANTS} className="xl:col-span-7">
           <div className="flex items-center gap-4 mb-6">
             <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-3xl shadow-indigo-100 rotate-3 transition-transform hover:rotate-0">
               <ShieldCheck size={32} strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic leading-none block mb-2">Institutional Node</span>
                <h1 className="text-4xl sm:text-6xl font-black text-slate-900 italic tracking-tighter uppercase leading-none text-balance">PROTOCOL <span className="text-indigo-600 not-italic">HUB</span></h1>
             </div>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] italic max-w-xl leading-relaxed">
             Request visitor access permissions and track real-time meeting durations.
             All entries require biometric verification and institutional approval.
           </p>
        </motion.div>
        
        <motion.div variants={ITEM_VARIANTS} className="xl:col-span-5 flex flex-wrap sm:flex-nowrap gap-4">
           <button
             onClick={fetchData}
             className="p-6 bg-slate-100 text-slate-600 rounded-[2.2rem] hover:bg-slate-200 transition-all active:scale-95 shadow-sm border border-slate-200/50 shrink-0"
             title="Sync Ledger"
           >
             <RotateCcw size={22} className={loading ? "animate-spin text-indigo-600" : ""} />
           </button>
           <button
             onClick={() => { setForm(initialForm); setEditingId(null); setShowModal(true); }}
             className="flex-1 min-w-[200px] group relative overflow-hidden flex items-center justify-center gap-5 px-10 py-7 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all transform hover:-translate-y-1 active:scale-95 shadow-3xl shadow-slate-900/20"
           >
             <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
             <Plus size={22} strokeWidth={3} className="relative z-10 group-hover:rotate-90 transition-transform" /> 
             <span className="relative z-10 italic">INITIATE REQUEST</span>
           </button>
        </motion.div>
      </div>



      {/* Main Ledger Table */}
      <div className="space-y-8">
         <motion.div variants={ITEM_VARIANTS} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden p-2">
            <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[1100px]">
                  <thead>
                     <tr className="bg-slate-50/50">
                        {[
                          "Visitor Hub", "Schedule", "Status", "Action"
                        ].map((h, i) => (
                          <th key={i} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">{h}</th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     <AnimatePresence mode="popLayout">
                        {visitors.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="py-48 text-center">
                                 <div className="inline-flex w-32 h-32 rounded-[3.5rem] bg-slate-50 items-center justify-center text-slate-200 mb-10 border border-slate-100 italic">
                                    <Inbox size={64} strokeWidth={1} />
                                 </div>
                                 <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">No Security Markers Found</h3>
                                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 italic">Synchronized ledger shows zero historical access logs.</p>
                              </td>
                           </tr>
                        ) : (
                           visitors.map(item => (
                              <motion.tr 
                                key={item._id} layout variants={ITEM_VARIANTS}
                                className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                              >
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-6">
                                       <div className="w-16 h-16 rounded-[1.4rem] overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 text-xl font-black italic border-2 border-white shadow-xl shrink-0 group-hover:scale-110 transition-transform duration-500">
                                          {item.visitorImage ? (
                                            <img src={item.visitorImage} alt={item.visitorName} className="w-full h-full object-cover" />
                                          ) : (
                                            item.visitorName?.[0]
                                          )}
                                       </div>
                                       <div>
                                          <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors leading-none">{item.visitorName}</p>
                                          <div className="flex items-center gap-3 mt-3">
                                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest text-slate-500 italic">
                                                <Phone size={10} /> {item.visitorPhone}
                                             </div>
                                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded text-[8px] font-black uppercase tracking-widest text-indigo-600 italic">
                                                <Users size={10} /> {item.relation}
                                             </div>
                                          </div>

                                          {(item.studentName === "HOSTEL-WIDE" || item.adminNote === "Broadcast entry") && (
                                            <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-black uppercase tracking-[0.2em] italic">
                                              Created By Admin
                                            </span>
                                          )}
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 italic">
                                        <Calendar size={12} className="text-indigo-600" />
                                        {new Date(item.visitDate).toLocaleDateString()}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 italic">
                                        <Clock size={12} />
                                        {item.visitTime} — {(() => {
                                          const [h, m] = (item.visitTime || "00:00").split(':').map(Number);
                                          const total = h * 60 + m + (item.expectedDuration || 0);
                                          const newH = Math.floor(total / 60) % 24;
                                          const newM = total % 60;
                                          return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                                        })()}
                                      </div>
                                    </div>
                                 </td>

                                 <td className="px-10 py-8">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic border ${
                                      item.status === 'Completed' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                                      item.status === 'Checked-In' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                      item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      item.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                      'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                       <div className={`w-1.5 h-1.5 rounded-full ${
                                         item.status === 'Checked-In' ? 'bg-indigo-500 animate-pulse' :
                                         item.status === 'Approved' ? 'bg-emerald-500' :
                                         item.status === 'Rejected' ? 'bg-rose-500' :
                                         item.status === 'Completed' ? 'bg-slate-300' : 'bg-amber-500 animate-pulse'
                                       }`} />
                                       {item.status}
                                    </div>
                                 </td>
                                 <td className="px-10 py-8">
                                    {item.status === 'Pending' && (
                                      <button 
                                        onClick={() => handleEdit(item)}
                                        className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                                      >
                                        <Edit3 size={16} />
                                      </button>
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
      </div>

      {/* Registration Modal */}
      <AnimatePresence>
         {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-3xl overflow-y-auto">
               <motion.div 
                 initial="hidden" animate="visible" exit="exit" variants={MODAL_VARIANTS}
                 className="bg-white w-full max-w-2xl rounded-[3.5rem] border border-slate-200 shadow-3xl p-8 sm:p-14 relative overflow-hidden my-auto"
               >
                  <button 
                    onClick={() => setShowModal(false)}
                    className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
                  >
                     <X size={20} />
                  </button>

                  <div className="flex items-center gap-6 mb-12">
                     <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl -rotate-3">
                        <UserPlus size={32} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                          {editingId ? "Update Request" : "New Entry Log"}
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">Security protocol verification required...</p>
                     </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="flex justify-center mb-6">
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

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">Visitor Name</label>
                           <input 
                              type="text" placeholder="LEGAL NAME" required
                              value={form.visitorName || ""} onChange={(e) => setForm({...form, visitorName: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all italic"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">Mobile Vector</label>
                           <input 
                              type="text" placeholder="+91 XXXXX XXXXX" required
                              value={form.visitorPhone || ""} onChange={(e) => setForm({...form, visitorPhone: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all italic"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">Relationship</label>
                           <select 
                              value={form.relation || "Parent"} onChange={(e) => setForm({...form, relation: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 italic appearance-none cursor-pointer"
                           >
                              <option value="Parent">Parent</option>
                              <option value="Sibling">Sibling</option>
                              <option value="Friend">Friend</option>
                              <option value="Relative">Relative</option>
                              <option value="Official">Official</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">Visit Date</label>
                           <input 
                              type="date" required
                              value={form.visitDate || ""} onChange={(e) => setForm({...form, visitDate: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 italic"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">Start Time (From)</label>
                           <input 
                              type="time" required
                              value={form.visitStartTime || ""} onChange={(e) => setForm({...form, visitStartTime: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 italic"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">End Time (To)</label>
                           <input 
                              type="time" required
                              value={form.visitEndTime || ""} onChange={(e) => setForm({...form, visitEndTime: e.target.value})}
                              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 italic"
                           />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 italic">Purpose/Notes</label>
                        <textarea 
                           placeholder="ADDITIONAL SECURITY CONTEXT..."
                           value={form.notes || ""} onChange={(e) => setForm({...form, notes: e.target.value})}
                           className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-900 italic h-24 resize-none"
                        />
                     </div>

                     <button 
                        type="submit" disabled={isSubmitting || isUploading}
                        className="w-full py-6 bg-slate-900 text-white font-black uppercase tracking-[0.4em] rounded-[2rem] hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-5 italic text-xs disabled:opacity-50"
                     >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : editingId ? <Edit3 size={20} /> : <ShieldCheck size={20} />}
                        {editingId ? "UPDATE SECURITY MARKER" : "INITIATE ACCESS REQUEST"}
                     </button>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </motion.div>
  );
}
