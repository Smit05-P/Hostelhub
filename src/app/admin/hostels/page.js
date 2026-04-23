"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  Plus, 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Loader2, 
  Search,
  CheckCircle2,
  XCircle,
  X,
  LayoutGrid,
  List,
  Shield,
  LogOut,
  Bell,
  Activity,
  Command,
  ShieldCheck,
  Building,
  LayoutDashboard,
  Hotel,
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  Check,
  Settings2,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useHostels } from "@/hooks/useHostels";
import { AutoApproveToggle, JoinCodeDisplay, ExpandableCodeModal, InlineCodeActions } from "@/components/JoinCodeComponents";

const AddHostelModal = ({ isOpen, onClose, onSuccess, adminId }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    hostelName: "",
    address: "",
    contactNumber: "",
    capacity: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hostelName.trim() || !form.address.trim()) {
      addToast("Hostel name and address are required.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post("/api/hostels", { ...form, capacity: parseInt(form.capacity) || 0, adminId });
      addToast(`${form.hostelName} registered successfully.`, "success");
      setForm({ hostelName: "", address: "", contactNumber: "", capacity: "" });
      onSuccess();
      onClose();
    } catch (error) {
      addToast(error.response?.data?.error || "Failed to register hostel.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
                Register <span className="text-indigo-600">Node</span>
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">New Facility Registration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Facility Name *</label>
            <input
              type="text"
              name="hostelName"
              value={form.hostelName}
              onChange={handleChange}
              required
              placeholder="e.g. Alpha Block Hostel"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Address *</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Full facility address"
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                placeholder="Phone number"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Capacity</label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                min="1"
                placeholder="Max residents"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={16} /> Register</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const FeeSettingsModal = ({ isOpen, onClose, hostel, onSuccess }) => {

  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeConfig, setFeeConfig] = useState({
    "6M": 30000,
    "1Y": 55000,
    "2Y": 100000,
    "3Y": 145000,
    "4Y": 185000
  });

  useEffect(() => {
    if (hostel?.settings?.feeConfig) {
      setFeeConfig(hostel.settings.feeConfig);
    }
  }, [hostel]);

  if (!isOpen || !hostel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.patch(`/api/hostels/${hostel.id}`, {
        settings: {
          ...hostel.settings,
          feeConfig
        }
      });
      addToast(`${hostel.hostelName} fee configuration updated.`, "success");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update fees:", error);
      addToast("Failed to synchronize fee configuration.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const durations = [
    { label: "6 Months", code: "6M" },
    { label: "1 Year", code: "1Y" },
    { label: "2 Years", code: "2Y" },
    { label: "3 Years", code: "3Y" },
    { label: "4 Years", code: "4Y" }
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">Fee <span className="text-indigo-600">Config</span></h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{hostel.hostelName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            {durations.map((d) => (
              <div key={d.code} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group focus-within:border-indigo-500/30 transition-all">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{d.label}</p>
                  <p className="text-xs font-bold text-slate-600">Occupancy Period</p>
                </div>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    value={feeConfig[d.code]}
                    onChange={(e) => setFeeConfig({ ...feeConfig, [d.code]: parseInt(e.target.value) || 0 })}
                    className="w-full pl-7 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Sync Configuration</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};


import { SkeletonHero, SkeletonCard, Shimmer } from "@/components/ui/Skeleton";

export default function HostelCollectionPage() {
  const { switchHostel, logout, userData, activeHostelId, user } = useAuth();
  const { addToast } = useToast();
  
  // Real-time data from hook
  const { data: hostelsData = [], isLoading: isHostelsLoading, toggleAutoApprove, isToggling } = useHostels();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feeModalHostel, setFeeModalHostel] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedHostel, setExpandedHostel] = useState(null);

  const hostels = hostelsData || [];

  const filteredHostels = useMemo(() => 
    hostels.filter(h => 
      h.hostelName?.toLowerCase().includes(search.toLowerCase()) || 
      h.ownerName?.toLowerCase().includes(search.toLowerCase())
    ), [hostels, search]
  );

  const stats = useMemo(() => {
    const totalFacilities = hostels.length;
    const totalCapacity = hostels.reduce((acc, h) => acc + (parseInt(h.capacity) || 0), 0);
    const activeNodes = hostels.filter(h => h.status !== "Inactive").length;
    return { totalFacilities, totalCapacity, activeNodes };
  }, [hostels]);

  if (isHostelsLoading && hostels.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Shimmer className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                 <Shimmer className="w-24 h-4 rounded" />
                 <Shimmer className="w-16 h-3 rounded" />
              </div>
           </div>
           <Shimmer className="w-32 h-10 rounded-xl" />
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-20 space-y-16">
           <div className="space-y-6">
              <Shimmer className="w-48 h-6 rounded-full" />
              <Shimmer className="w-2/3 h-20 rounded-2xl" />
              <Shimmer className="w-1/2 h-6 rounded-xl" />
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 space-y-4">
                 <Shimmer className="w-14 h-14 rounded-2xl" />
                 <Shimmer className="w-1/2 h-10 rounded-xl" />
                 <Shimmer className="w-1/3 h-4 rounded" />
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 space-y-4">
                 <Shimmer className="w-14 h-14 rounded-2xl" />
                 <Shimmer className="w-1/2 h-10 rounded-xl" />
                 <Shimmer className="w-1/3 h-4 rounded" />
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 space-y-4">
                 <Shimmer className="w-14 h-14 rounded-2xl" />
                 <Shimmer className="w-1/2 h-10 rounded-xl" />
                 <Shimmer className="w-1/3 h-4 rounded" />
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-8">
                   <div className="flex justify-between">
                      <Shimmer className="w-14 h-14 rounded-2xl" />
                      <Shimmer className="w-24 h-8 rounded-full" />
                   </div>
                   <div className="space-y-3">
                      <Shimmer className="w-2/3 h-8 rounded-xl" />
                      <Shimmer className="w-1/2 h-4 rounded" />
                   </div>
                   <div className="space-y-4 pt-8 border-t border-slate-50">
                      <Shimmer className="w-full h-14 rounded-2xl" />
                      <div className="grid grid-cols-2 gap-4">
                         <Shimmer className="h-16 rounded-2xl" />
                         <Shimmer className="h-16 rounded-2xl" />
                      </div>
                      <Shimmer className="w-full h-14 rounded-[1.5rem]" />
                   </div>
                </div>
              ))}
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-jakarta selection:bg-indigo-500/10 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-indigo-500/[0.04] blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-purple-500/[0.04] blur-[140px] rounded-full"></div>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Hostel<span className="text-indigo-600">Hub</span></h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] -mt-0.5">Control Nexus</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
           <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200">
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">{userData?.name || "Administrator"}</span>
                <span className="text-[9px] text-indigo-600 font-black uppercase tracking-[0.2em]">Priority Alpha</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Users size={18} className="text-slate-400" />
                )}
              </div>
           </div>

           <button 
              onClick={logout}
              title="Logout"
              className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl border border-slate-200 hover:border-rose-200 transition-all active:scale-95"
            >
              <LogOut size={18} />
            </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col min-h-screen">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="space-y-6">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">
                 <Shield size={14} className="animate-pulse" />
                 Secure Portfolio Nexus
               </div>
               <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 italic uppercase">
                 Facility <span className="text-indigo-600">Grid</span>
               </h1>
               <p className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed">
                 Streamlined orchestration of your institutional network with high-precision control modules.
               </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
               <div className="relative group w-full sm:w-80">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-all" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search Node IDs..."
                    className="w-full py-4 pl-14 pr-6 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300 text-slate-900 shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
               <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto h-14 px-8 bg-indigo-600 hover:bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                  Register Node
                </button>
            </div>
          </div>
        </motion.div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col group hover:border-indigo-500/30 transition-all">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
               <p className="text-4xl font-black text-slate-900 mb-1 uppercase italic tracking-tighter">{stats.totalFacilities}</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Establishments</p>
            </motion.div>

           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col group hover:border-emerald-500/40 transition-all">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
               <p className="text-4xl font-black text-slate-900 mb-1 uppercase italic tracking-tighter">{stats.totalCapacity}</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Network Capacity</p>
            </motion.div>

           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col group hover:border-amber-500/40 transition-all">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 border border-amber-100 group-hover:scale-110 transition-transform">
                <Zap size={24} className="animate-pulse" />
              </div>
               <p className="text-4xl font-black text-slate-900 mb-1 uppercase italic tracking-tighter">{stats.activeNodes}</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Active Sync Nodes</p>
            </motion.div>
        </div>

        {/* Collection Grid */}
        {filteredHostels.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 animate-in fade-in duration-1000">
             <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 border border-slate-200 mb-8 shadow-inner">
                <Building size={48} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter italic">Zero Nodes Detected</h3>
             <p className="text-slate-400 font-bold max-w-sm text-center text-sm leading-relaxed mb-10 uppercase tracking-widest">
               Your network is offline. Register your first facility to initialize the management core.
             </p>
             <button 
                onClick={() => setIsModalOpen(true)}
                className="h-12 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all text-[10px] uppercase tracking-[0.2em]"
             >
               Initialize Network
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-32">
            {filteredHostels.map((hostel, idx) => {
              const active = activeHostelId === (hostel._id || hostel.id);
              return (
                <motion.div 
                   key={hostel._id || hostel.id} 
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   whileHover={{ 
                     y: -12, 
                     scale: 1.02,
                     transition: { type: "spring", stiffness: 400, damping: 10 }
                   }}
                   transition={{ delay: idx * 0.05, duration: 0.8, ease: "circOut" }}
                   className={`bg-white p-8 rounded-[2.5rem] flex flex-col border transition-all duration-500 relative group/card overflow-hidden cursor-default ${active ? 'border-indigo-500 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.2)]' : 'border-slate-200 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-slate-200/50'}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${active ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover/card:text-indigo-600 group-hover/card:border-indigo-500/20'}`}
                    >
                      <Hotel size={24} />
                    </motion.div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFeeModalHostel(hostel); }}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-90"
                        title="Configure Fees"
                      >
                        <DollarSign size={16} />
                      </button>
                      <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all ${hostel.status === 'Inactive' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${hostel.status === 'Inactive' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                         <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${hostel.status === 'Inactive' ? 'text-rose-600' : 'text-emerald-600'}`}>{hostel.status || 'Active'}</span>
                      </div>
                    </div>
                  </div>
                  
                   <div className="flex-1 space-y-3 relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic group-hover/card:text-indigo-600 transition-colors duration-300 transform group-hover/card:skew-x-[-2deg]">{hostel.hostelName}</h3>
                      <motion.button 
                        whileHover={{ scale: 1.2, rotate: 45 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 opacity-0 group-hover/card:opacity-100 transition-all hover:text-indigo-600 hover:border-indigo-200"
                      >
                        <ArrowUpRight size={18} />
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-400">
                       <Users size={14} className="text-indigo-500/40" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{hostel.ownerName || "Autonomous Node"}</span>
                    </div>
                  </div>

                   <div className="mt-10 pt-8 border-t border-slate-100 space-y-8 relative z-10">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocol</span>
                          <span className="block text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{hostel.autoApprove ? "AUTO-SYNC" : "MANUAL-GATE"}</span>
                        </div>
                        <AutoApproveToggle 
                           enabled={hostel.autoApprove} 
                           onToggle={() => toggleAutoApprove({ hostelId: hostel._id || hostel.id, currentValue: hostel.autoApprove })}
                           loading={isToggling}
                        />
                     </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group/code cursor-pointer hover:border-indigo-500/20 transition-all relative overflow-hidden" onClick={() => setExpandedHostel(hostel)}>
                        <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover/code:translate-y-0 transition-transform duration-500" />
                        <div className="space-y-0.5 relative z-10">
                          <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-[0.3em]">Encryption-Key</span>
                          <span className="block text-sm font-mono font-black tracking-[0.2em] text-slate-900 italic">{hostel.joinCode}</span>
                        </div>
                        <div className="relative z-10">
                           <InlineCodeActions code={hostel.joinCode} />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <motion.div whileHover={{ y: -4 }} className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Occupancy</p>
                           <div className="flex items-end gap-2">
                             <p className="text-xl font-black text-slate-900 italic">{(hostel.totalStudents || 0)}</p>
                             <p className="text-[9px] font-black text-slate-300 mb-1">UNIT</p>
                           </div>
                        </motion.div>
                        <motion.div whileHover={{ y: -4 }} className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Grid Size</p>
                           <div className="flex items-end gap-2">
                             <p className="text-xl font-black text-slate-900 italic">{(hostel.capacity || 0)}</p>
                             <p className="text-[9px] font-black text-slate-300 mb-1">CAP</p>
                           </div>
                        </motion.div>
                     </div>

                     <motion.button 
                        whileHover={{ 
                          scale: 1.02,
                          backgroundColor: active ? "#4338ca" : "#0f172a",
                          boxShadow: "0 20px 40px -10px rgba(79,70,229,0.3)"
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToast(`Establishing secure link to ${hostel.hostelName}...`, "success");
                          switchHostel(hostel._id || hostel.id);
                        }}
                        className={`btn-shimmer w-full h-14 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all duration-300 text-[10px] font-black uppercase tracking-[0.4em] italic group/btn ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-900 text-white'}`}
                      >
                         <span className="relative z-10">Access Panel</span>
                         <ArrowRight size={18} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                      </motion.button>
                   </div>

                  {active && (
                    <div className="absolute top-6 right-6 w-8 h-8 bg-indigo-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg z-20">
                       <Check size={14} className="text-white" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <ExpandableCodeModal 
          hostel={expandedHostel}
          onClose={() => setExpandedHostel(null)}
        />

        <AddHostelModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {}} 
          adminId={user?.id || (user?.id || user?.uid)}
        />

        <FeeSettingsModal
          isOpen={!!feeModalHostel}
          onClose={() => setFeeModalHostel(null)}
          hostel={feeModalHostel}
          onSuccess={() => {}}
        />

        {/* Footer */}
        <footer className="mt-auto py-16 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 text-[9px] font-black uppercase tracking-[0.4em] italic">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                 <Shield size={14} className="text-slate-400" />
              </div>
              <span className="text-slate-500">HostelHub DeepMind Core 27.4 — Portfolio Management Grid</span>
           </div>
           <div className="flex items-center gap-8 text-slate-500">
              <span className="hover:text-indigo-600 transition-colors cursor-pointer border-b border-transparent hover:border-indigo-500/50">Service Matrix</span>
              <span className="flex items-center gap-2 text-emerald-600">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 Grid Status: Optimal
              </span>
           </div>
        </footer>
      </main>
    </div>
  );
}
