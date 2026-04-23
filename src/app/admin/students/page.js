"use client";

import { useEffect, useState, useMemo, memo } from "react";
import axios from "axios";
import {
  AlertCircle, BadgeCheck, Timer, TrendingUp, Filter, Sparkles, Zap, ShieldCheck, 
  ArrowRight, ArrowUpRight, Search, RefreshCw, ChevronLeft, ChevronRight, UserX, 
  Mail, Phone, Home, Pencil, Trash2, UserMinus, Clock, Loader2, Download, User, 
  UserPlus, CheckCircle2, Building, X, CreditCard, Calendar, Hash, Activity, Users,
  Target, Monitor, ShieldAlert, Maximize2, Database, DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

const DURATION_OPTIONS = [
  { label: "6 Months", value: "6M", months: 6 },
  { label: "1 Year",   value: "1Y", months: 12 },
  { label: "2 Years",  value: "2Y", months: 24 },
  { label: "3 Years",  value: "3Y", months: 36 },
  { label: "4 Years",  value: "4Y", months: 48 },
];
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' }) : '?';

function calcLifecycle(arrivalDate, duration) {
  if (!arrivalDate || !duration) return { termEndDate: "", daysLeft: null };
  const opt = DURATION_OPTIONS.find((o) => o.value === duration);
  if (!opt) return { termEndDate: "", daysLeft: null };
  const arrival = new Date(arrivalDate);
  const end = new Date(arrival);
  end.setMonth(end.getMonth() + opt.months);
  const now = new Date();
  const daysLeft = Math.ceil((end - now) / 86400000);
  return {
    termEndDate: end.toISOString().split("T")[0],
    daysLeft: Math.max(0, daysLeft),
  };
}

const Avatar = memo(({ student, size = 12 }) => {
  const [imgError, setImgError] = useState(false);
  const initial = student?.name?.charAt(0)?.toUpperCase() || "?";
  const avatarUrl = student?.profileImage || student?.photoURL;
  return (
    <div className={`w-${size} h-${size} rounded-[1.2rem] overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-inner group-hover:border-indigo-200 transition-all duration-500`}>
      {avatarUrl && !imgError ? (
        <img src={avatarUrl} alt={student.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <span className="text-lg font-black text-slate-400 italic uppercase">{initial}</span>
      )}
    </div>
  );
});

const StatusBadge = memo(({ status, type = "lifecycle" }) => {
  const configs = {
    lifecycle: {
      Active:    "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-500/5",
      Pending:   "bg-slate-50 text-slate-500 border-slate-200 shadow-slate-500/5",
      Completed: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-500/5",
      Inactive:  "bg-rose-50 text-rose-500 border-rose-100 shadow-rose-500/5",
    },
    payment: {
      Paid:    "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-500/5",
      Pending: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/5",
      Overdue: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/10",
    }
  };
  const current = configs[type][status] || configs[type].Pending;
  const dotColor = status === 'Active' || status === 'Paid' ? 'bg-emerald-500' : 
                   status === 'Pending' ? 'bg-amber-500' : 
                   status === 'Overdue' || status === 'Inactive' ? 'bg-rose-500' : 'bg-blue-500';
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] italic ${current}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${status === 'Active' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
});

import { SkeletonHero, SkeletonCard, Shimmer } from "@/components/ui/Skeleton";

export default function AdminStudentsPage() {
  const { activeHostelId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current hostel settings for fee config
  const { data: activeHostel } = useQuery({
    queryKey: ["hostel", activeHostelId],
    queryFn: async () => {
      if (!activeHostelId) return null;
      const res = await axios.get(`/api/hostels/${activeHostelId}`);
      return res.data;
    },
    enabled: !!activeHostelId
  });

  const feeConfig = useMemo(() => {
    return activeHostel?.settings?.feeConfig || {
      "6M": 30000, "1Y": 55000, "2Y": 100000, "3Y": 145000, "4Y": 185000
    };
  }, [activeHostel]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ status: "All", allocation: "All" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({ enrollmentId: "", duration: "6M", arrivalDate: "", roomId: "", rentAmount: 0, status: "Pending" });

  const { data: studentsData = { students: [], total: 0 }, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', activeHostelId],
    queryFn: async () => {
      const res = await axios.get(`/api/students`, { params: { hostelId: activeHostelId } });
      return res.data || { students: [], total: 0 };
    },
    enabled: !!activeHostelId,
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const students = Array.isArray(studentsData.students) ? studentsData.students : [];

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', activeHostelId],
    queryFn: async () => {
      const res = await axios.get(`/api/rooms`, { params: { hostelId: activeHostelId } });
      return res.data || [];
    },
    enabled: !!activeHostelId,
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { id, ...updates } = data;
      return axios.put(`/api/students/${id}`, updates);
    },
    onMutate: async (updatedStudent) => {
      await queryClient.cancelQueries({ queryKey: ['students', activeHostelId] });
      const previousStudents = queryClient.getQueryData(['students', activeHostelId]);
      
      queryClient.setQueryData(['students', activeHostelId], (old) => {
        if (!old) return old;
        const { id, ...rest } = updatedStudent;
        return {
          ...old,
          students: old.students.map(s => 
            s._id === id ? { ...s, ...rest } : s
          )
        };
      });

      return { previousStudents };
    },
    onError: (err, updatedStudent, context) => {
      queryClient.setQueryData(['students', activeHostelId], context.previousStudents);
      toast.error(err.response?.data?.error || "Synchronize interrupt.");
    },
    onSuccess: () => {
      toast.success("Identity profile synchronized.");
      setIsModalOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['students', activeHostelId] });
    }
  });

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || 
                           s.email?.toLowerCase().includes(search.toLowerCase()) ||
                           s.enrollmentId?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filter.status === "All" || s.status === filter.status;
      const matchesAlloc = filter.allocation === "All" || (filter.allocation === "Allocated" ? !!(s.roomId?.roomNumber || s.roomNumber) : !(s.roomId?.roomNumber || s.roomNumber));
      return matchesSearch && matchesStatus && matchesAlloc;
    });
  }, [students, search, filter]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === 'Active').length,
    unallocated: students.filter(s => !(s.roomId?.roomNumber || s.roomNumber)).length,
    overdue: students.filter(s => s.paymentStatus === 'Overdue').length,
  }), [students]);

  const handleEdit = (student) => {
    setSelectedStudent(student);
    const duration = student.duration || "6M";
    setFormData({
      enrollmentId: student.enrollmentId || "",
      duration: duration,
      arrivalDate: student.arrivalDate ? new Date(student.arrivalDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      roomId: student.roomId?._id || student.roomId || "",
      rentAmount: student.rentAmount || feeConfig[duration] || 0,
      status: student.status || "Pending"
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const { termEndDate, daysLeft } = calcLifecycle(formData.arrivalDate, formData.duration);
    updateMutation.mutate({
      id: selectedStudent._id,
      ...formData,
      termEndDate,
      daysLeft,
      lastUpdated: new Date().toISOString()
    });
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Enrollment ID", "Phone", "Unit", "Status", "Arrival", "Term End"];
    const csvRows = filtered.map(s => [
      s.name, s.email, s.enrollmentId, s.phone, s.roomNumber || "Unassigned", s.status, s.arrivalDate, s.termEndDate
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Residents_Ledger.csv`;
    a.click();
    a.remove();
  };

  if (loadingStudents && students.length === 0) {
    return (
      <div className="space-y-12 pb-24">
        <SkeletonHero />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl p-10 space-y-8">
           <Shimmer className="w-full h-16 rounded-3xl" />
           {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="flex items-center gap-6 py-4 border-b border-slate-50">
                <Shimmer className="w-16 h-16 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Shimmer className="w-1/3 h-5 rounded-lg" />
                  <Shimmer className="w-1/4 h-3 rounded-lg" />
                </div>
                <Shimmer className="w-24 h-10 rounded-2xl" />
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
      className="space-y-12 pb-24"
    >
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
         <div>
            <div className="inline-flex items-center gap-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-100 italic mb-5 shadow-sm">
               INSTITUTIONAL IDENTITY CORE
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none flex items-center gap-5">
               <Activity size={48} className="text-indigo-600" /> RESIDENT NEXUS
            </h1>
            <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.3em] mt-5 italic leading-none opacity-80">Global facility authorization & lifecycle synchronization hub</p>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-xl">
            <div className="relative group w-full sm:w-72">
               <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
               <input 
                 type="text" 
                 placeholder="PROBE IDENTITY ID..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-16 pr-8 py-4 bg-transparent border-none focus:ring-0 text-[12px] font-black uppercase tracking-widest text-slate-700 placeholder:text-slate-300 italic"
               />
            </div>
            <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
            <div className="flex bg-slate-50 p-1.5 rounded-2xl mx-4">
              {['All', 'Active', 'Pending'].map(s => (
                <button 
                  key={s}
                  onClick={() => setFilter(prev => ({ ...prev, status: s }))}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic ${filter.status === s ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
            <button onClick={exportCSV} className="flex items-center gap-3 px-10 py-4 bg-white text-slate-900 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all italic border border-slate-200 shadow-sm">
               EXTRACT <Download size={16} />
            </button>
         </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Total Load", value: stats.total, color: "bg-indigo-600" },
           { label: "Active Pulse", value: stats.active, color: "bg-emerald-600" },
           { label: "Null Allocation", value: stats.unallocated, color: "bg-amber-500" },
           { label: "Overdue Dissonance", value: stats.overdue, color: "bg-rose-600" }
         ].map((stat, i) => (
           <SummaryCard key={i} label={stat.label} value={stat.value} color={stat.color} />
         ))}
      </div>

      {/* Table Section (Desktop) / Card Stack (Mobile) */}
      <div className="bg-white rounded-[3rem] sm:rounded-[4.5rem] border border-slate-200 shadow-2xl overflow-hidden p-2 sm:p-3">
         {/* Desktop Table View */}
         <div className="hidden lg:block overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[1200px]">
               <thead>
                  <tr className="bg-slate-50/50">
                     {[
                       "Resident Identity", "Enrollment Node", "Spatial Node", "Duration & Fee", "Integrity State", "Ops"
                     ].map((h, i) => (
                       <th key={i} className={`px-10 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic ${h === 'Ops' ? 'text-right' : ''}`}>{h}</th>
                     ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 relative">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {filtered.length === 0 ? (
                      <tr>
                         <td colSpan={6} className="py-48 text-center opacity-20">
                            <Database size={80} className="mx-auto mb-8 text-slate-400" />
                            <p className="font-black uppercase tracking-[0.5em] text-[14px] text-slate-400 italic">No Synchronization Markers Match Filters</p>
                         </td>
                      </tr>
                    ) : (
                      filtered.map((s, i) => (
                        <motion.tr 
                          key={s._id || i} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                          transition={{ delay: i * 0.02, duration: 0.3 }}
                          className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                        >
                           <td className="px-10 py-8" onClick={() => handleEdit(s)}>
                              <div className="flex items-center gap-5">
                                 <Avatar student={s} size={14} />
                                 <div className="flex flex-col">
                                    <p className="text-base font-black text-slate-900 uppercase tracking-tight italic group-hover:text-indigo-600 transition-colors">{s.name}</p>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 leading-none">{s.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex flex-col gap-1.5">
                                 <span className="text-[13px] font-black text-slate-700 uppercase italic leading-none">{s.enrollmentId || "HH-NULL-X"}</span>
                                 <span className="text-[10px] font-black text-slate-400 uppercase italic opacity-60">{s.phone || "No Pulse"}</span>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              {s.roomId?.roomNumber || s.roomNumber ? (
                                <span className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] italic shadow-lg">UNIT {s.roomId?.roomNumber || s.roomNumber}</span>
                              ) : (
                                <span className="px-4 py-2 rounded-xl bg-rose-50 text-rose-500 text-[10px] font-black border border-rose-100 uppercase italic">Unassigned</span>
                              )}
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-6">
                                 <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                       <Clock size={14} className="text-indigo-400" />
                                       <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">{s.duration || "6M"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <DollarSign size={14} className="text-emerald-500" />
                                       <span className="text-[11px] font-black text-emerald-600 italic">${s.rentAmount?.toLocaleString() || feeConfig[s.duration || "6M"]?.toLocaleString() || "0"}</span>
                                    </div>
                                 </div>
                                 <div className="h-10 w-[1px] bg-slate-100" />
                                 <div>
                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">{fmtDate(s.arrivalDate)}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic mt-1">Arr</p>
                                 </div>
                                 <ArrowRight size={14} className="text-slate-200" />
                                 <div className="bg-indigo-50/50 px-3 py-2 rounded-xl border border-indigo-100/50 flex flex-col items-center">
                                    <span className="text-base font-black text-indigo-900 italic tracking-tighter leading-none">{s.daysLeft || 0}</span>
                                    <span className="text-[7px] font-black text-indigo-400 uppercase">Days Left</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <StatusBadge status={s.status || "Pending"} />
                           </td>
                           <td className="px-10 py-8 text-right">
                              <button onClick={() => handleEdit(s)} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-100 hover:bg-slate-50 transition-all shadow-sm active:scale-90">
                                 <Pencil size={18} />
                              </button>
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
               {filtered.length === 0 ? (
                  <div className="py-32 text-center opacity-20">
                     <Database size={60} className="mx-auto mb-6 text-slate-400" />
                     <p className="font-black uppercase tracking-[0.3em] text-[12px] text-slate-400 italic">No Synchronization Markers</p>
                  </div>
               ) : (
                  filtered.map((s) => (
                     <motion.div 
                       key={s._id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 hover:bg-white transition-all relative group"
                       onClick={() => handleEdit(s)}
                     >
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <Avatar student={s} size={14} />
                              <div>
                                 <p className="text-lg font-black text-slate-900 uppercase italic leading-none">{s.name}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">{s.enrollmentId || "NO-ID"}</p>
                              </div>
                           </div>
                           <button className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl">
                              <Pencil size={16} />
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                           <div className="p-4 bg-white rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">UNIT</p>
                              <p className="text-xs font-black text-slate-700 italic uppercase truncate">{s.roomId?.roomNumber || s.roomNumber || "UNASSIGNED"}</p>
                           </div>
                           <div className="p-4 bg-white rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic">TERM END</p>
                              <p className="text-xs font-black text-slate-700 italic uppercase">{fmtDate(s.termEndDate)}</p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between">
                           <StatusBadge status={s.status || "Pending"} />
                           <div className="flex items-center gap-2">
                              <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase italic">
                                 {s.daysLeft || 0} DAYS LEFT
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  ))
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Edit Modal (Responsive Wizard) */}
      <AnimatePresence>
         {isModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: "100%" }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-4xl rounded-t-[3rem] sm:rounded-[4rem] shadow-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]"
              >
                 <EditModalContent 
                   formData={formData} 
                   setFormData={setFormData} 
                   selectedStudent={selectedStudent} 
                   rooms={rooms} 
                   onClose={() => setIsModalOpen(false)} 
                   onSave={handleSave}
                   isPending={updateMutation.isPending}
                 />
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </motion.div>
  );
}

const EditModalContent = ({ formData, setFormData, selectedStudent, rooms, onClose, onSave, isPending }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const renderDesktop = () => (
    <div className="hidden md:flex flex-col h-full">
      <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">PROTOCOL EDIT</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Synchronizing Resident identity encryption markers</p>
          </div>
        </div>
        <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center shadow-sm">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={onSave} className="overflow-y-auto flex-1 p-12 space-y-12 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Column 1 */}
          <div className="space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <User size={16} className="text-indigo-500" />
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] italic">IDENTITY VECTOR</h3>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Ledger ID Signature</label>
              <div className="relative group">
                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-all" />
                <input type="text" value={formData.enrollmentId} readOnly disabled className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[12px] font-black uppercase tracking-widest transition-all italic text-slate-500 cursor-not-allowed" placeholder="HH-IDX-XXXXX" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Pulse State</label>
                <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/5 outline-none italic">
                  <option value="Pending">Pending</option>
                  <option value="Active">Active Pulse</option>
                  <option value="Inactive">Locked</option>
                  <option value="Completed">Terminated</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Node Allocation</label>
                <select value={formData.roomId} onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))} className="w-full h-16 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/5 outline-none italic">
                  <option value="">Null Node</option>
                  {rooms.filter(r => (r.occupants?.length || 0) < (r.capacity || 1) || r._id === (selectedStudent?.roomId?._id || selectedStudent?.roomId)).map(r => (
                    <option key={r._id} value={r._id}>Spatial Unit {r.roomNumber}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-4 mb-2">
                <Database size={14} className="text-amber-500" />
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">ACADEMIC PROFILE (LOCKED)</h4>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Institution</p>
                  <p className="text-[11px] font-bold text-slate-900 italic uppercase">{selectedStudent?.collegeName || "Not Provided"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Course</p>
                    <p className="text-[11px] font-bold text-slate-900 italic uppercase">{selectedStudent?.course || "NA"}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Year</p>
                    <p className="text-[11px] font-bold text-slate-900 italic uppercase">{selectedStudent?.year || "NA"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <Calendar size={16} className="text-indigo-500" />
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] italic">TEMPORAL LIFECYCLE</h3>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Initiation Timestamp</label>
              <input type="date" value={formData.arrivalDate} readOnly disabled className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all outline-none italic text-slate-500 cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Duration</label>
                <div className="h-16 px-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-600 uppercase italic">{formData.duration}</span>
                  <Clock size={14} className="text-indigo-400" />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Agreed Rent ($)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-emerald-500 transition-all" />
                  <input type="number" value={formData.rentAmount} readOnly disabled className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[12px] font-black uppercase tracking-widest transition-all italic text-slate-500 cursor-not-allowed" />
                </div>
              </div>
            </div>
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-4 mb-2">
                <ShieldAlert size={14} className="text-rose-500" />
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">EMERGENCY PROTOCOL (LOCKED)</h4>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Guardian Name</p>
                  <p className="text-[11px] font-bold text-slate-900 italic uppercase">{selectedStudent?.guardianName || "Not Provided"}</p>
                </div>
                <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100">
                  <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">Emergency SOS</p>
                  <p className="text-[11px] font-bold text-rose-600 italic uppercase font-mono">{selectedStudent?.emergencyContact || "No Vector"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex items-center justify-end gap-6">
          <button type="button" onClick={onClose} className="h-16 px-10 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-all italic">ABORT SYNC</button>
          <button type="submit" disabled={isPending} className="h-20 px-16 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] italic shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-30 flex items-center gap-4">
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={20} />}
            EXECUTE CONFIGURATION
          </button>
        </div>
      </form>
    </div>
  );

  const renderMobileWizard = () => (
    <div className="md:hidden flex flex-col h-full">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 italic uppercase leading-none">PROTOCOL EDIT</h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">Step {step} of {totalSteps}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 flex items-center justify-center shadow-sm">
            <X size={20} />
          </button>
        </div>
        
        {/* Step Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <User size={16} className="text-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">IDENTITY & SPATIAL</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Ledger ID Signature</label>
                  <div className="relative">
                    <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" value={formData.enrollmentId} readOnly disabled className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 italic" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Pulse State</label>
                  <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest italic outline-none">
                    <option value="Pending">Pending</option>
                    <option value="Active">Active Pulse</option>
                    <option value="Inactive">Locked</option>
                    <option value="Completed">Terminated</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Node Allocation</label>
                  <select value={formData.roomId} onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))} className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest italic outline-none">
                    <option value="">Null Node</option>
                    {rooms.filter(r => (r.occupants?.length || 0) < (r.capacity || 1) || r._id === (selectedStudent?.roomId?._id || selectedStudent?.roomId)).map(r => (
                      <option key={r._id} value={r._id}>Spatial Unit {r.roomNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <Calendar size={16} className="text-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">LIFECYCLE & FISCAL</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Initiation Timestamp</label>
                  <input type="date" value={formData.arrivalDate} readOnly disabled className="w-full h-14 px-8 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest italic text-slate-400" />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Spectral Duration</label>
                  <div className="h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-600 uppercase italic">{formData.duration}</span>
                    <Clock size={14} className="text-indigo-400" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Agreed Rent ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="number" value={formData.rentAmount} readOnly disabled className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 italic" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <ShieldAlert size={16} className="text-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">INSTITUTIONAL PROFILE</h3>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">INSTITUTION</p>
                  <p className="text-[11px] font-bold text-slate-900 italic uppercase">{selectedStudent?.collegeName || "NA"}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">GUARDIAN</p>
                  <p className="text-[11px] font-bold text-slate-900 italic uppercase">{selectedStudent?.guardianName || "NA"}</p>
                </div>
                <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100">
                  <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1 italic">EMERGENCY SOS</p>
                  <p className="text-[11px] font-bold text-rose-600 italic uppercase font-mono">{selectedStudent?.emergencyContact || "NA"}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 border-t border-slate-100 bg-white flex gap-4">
        {step > 1 ? (
          <button 
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest italic"
          >
            BACK
          </button>
        ) : (
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest italic"
          >
            ABORT
          </button>
        )}

        {step < totalSteps ? (
          <button 
            onClick={() => setStep(s => s + 1)}
            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-xl"
          >
            CONTINUE
          </button>
        ) : (
          <button 
            onClick={onSave}
            disabled={isPending}
            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            EXECUTE SYNC
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {renderDesktop()}
      {renderMobileWizard()}
    </>
  );
};

function SummaryCard({ label, value, color }) {
  const Icon = label.includes("Load") ? Users : label.includes("Pulse") ? Activity : label.includes("Allocation") ? Building : AlertCircle;
  return (
    <motion.div variants={ITEM_VARIANTS} className="premium-glass p-8 rounded-[2.5rem] border border-slate-200/60 flex items-center justify-between shadow-lg group bg-white shadow-xl">
       <div className="space-y-2">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic leading-none">{label}</span>
          <p className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">{value}</p>
       </div>
       <div className={`w-14 h-14 rounded-[1.5rem] ${color} bg-opacity-10 flex items-center justify-center text-slate-900 border border-white/20 shadow-inner italic transition-transform group-hover:scale-110`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
       </div>
    </motion.div>
  );
}
