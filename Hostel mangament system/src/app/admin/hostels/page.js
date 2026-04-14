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
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useHostels } from "@/hooks/useHostels";
import { AutoApproveToggle, JoinCodeDisplay, ExpandableCodeModal } from "@/components/JoinCodeComponents";

const AddHostelModal = ({ isOpen, onClose, onSuccess, adminId }) => {
  const [formData, setFormData] = useState({
    hostelName: "",
    ownerName: "",
    address: "",
    contactNumber: "",
    capacity: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post("/api/hostels", { ...formData, adminId });
      onSuccess();
      onClose();
      setFormData({ hostelName: "", ownerName: "", address: "", contactNumber: "", capacity: "" });
    } catch (error) {
      console.error("Failed to add hostel:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-slide-up">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Add New Hostel</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enter the details of the new facility</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-1">Hostel Name</label>
              <div className="relative group">
                <Hotel className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  required
                  type="text"
                  placeholder="e.g. Royal Heritage Residency"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
                  value={formData.hostelName}
                  onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-1">Manager / Owner Name</label>
              <div className="relative group">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  required
                  type="text"
                  placeholder="e.g. Samuel Jackson"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-1">Address</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                <textarea
                  required
                  placeholder="Full physical address..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 resize-none h-24"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 ml-1">Contact Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  <input
                    required
                    type="text"
                    placeholder="+91..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 ml-1">Total Capacity</label>
                <div className="relative group">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  <input
                    required
                    type="number"
                    placeholder="Beds"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Create Hostel</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default function HostelCollectionPage() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedHostel, setExpandedHostel] = useState(null);
  const { switchHostel, logout, userData, activeHostelId, user } = useAuth();
  const { addToast } = useToast();
  const { toggleAutoApprove, isToggling } = useHostels();

  const fetchHostels = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/hostels", {
        params: { adminId: user.uid }
      });
      const data = res.data || [];
      setHostels(data);
    } catch (error) {
      console.error("Failed to fetch hostels:", error);
      addToast("Failed to load facility data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchHostels();
    }
  }, [user]);

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

  if (loading && hostels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] gap-8">
        <div className="relative">
          <div className="w-20 h-20 border-[5px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-pulse" size={20} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Grid...</p>
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
              const active = activeHostelId === hostel.id;
              return (
                <motion.div 
                   key={hostel.id} 
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.1, duration: 0.8, ease: "circOut" }}
                   className={`bg-white p-8 rounded-[2.5rem] flex flex-col border transition-all duration-700 relative group overflow-hidden ${active ? 'border-indigo-500 shadow-2xl shadow-indigo-500/10' : 'border-slate-200 hover:border-indigo-500/30'}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${active ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-500/20'}`}>
                      <Hotel size={24} />
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all ${hostel.status === 'Inactive' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${hostel.status === 'Inactive' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                       <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${hostel.status === 'Inactive' ? 'text-rose-600' : 'text-emerald-600'}`}>{hostel.status || 'Active'}</span>
                    </div>
                  </div>
                  
                   <div className="flex-1 space-y-3 relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic group-hover:text-indigo-600 transition-colors duration-300">{hostel.hostelName}</h3>
                      <button className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-indigo-600 hover:border-indigo-200">
                        <ArrowUpRight size={18} />
                      </button>
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
                           onToggle={() => toggleAutoApprove({ hostelId: hostel.id, currentValue: hostel.autoApprove })}
                           loading={isToggling}
                        />
                     </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group/code cursor-pointer hover:border-indigo-500/20 transition-all" onClick={() => setExpandedHostel(hostel)}>
                        <div className="space-y-0.5">
                          <span className="block text-[8px] font-black text-indigo-500 uppercase tracking-[0.3em]">Encryption-Key</span>
                          <span className="block text-sm font-mono font-black tracking-[0.2em] text-slate-900 italic">{hostel.joinCode}</span>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 group-hover/code:bg-indigo-600 group-hover/code:text-white group-hover/code:border-indigo-600 transition-all">
                           <Zap size={14} />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Occupancy</p>
                           <div className="flex items-end gap-2">
                             <p className="text-xl font-black text-slate-900 italic">{(hostel.totalStudents || 0)}</p>
                             <p className="text-[9px] font-black text-slate-300 mb-1">UNIT</p>
                           </div>
                        </div>
                        <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Grid Size</p>
                           <div className="flex items-end gap-2">
                             <p className="text-xl font-black text-slate-900 italic">{(hostel.capacity || 0)}</p>
                             <p className="text-[9px] font-black text-slate-300 mb-1">CAP</p>
                           </div>
                        </div>
                     </div>

                     <button 
                        onClick={() => {
                          addToast(`Establishing secure link to ${hostel.hostelName}...`, "success");
                          switchHostel(hostel.id);
                        }}
                        className={`w-full h-14 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all duration-500 text-[10px] font-black uppercase tracking-[0.4em] italic ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                      >
                         <span>Access Panel</span>
                         <ArrowRight size={18} />
                      </button>
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
          isOpen={!!expandedHostel}
          onClose={() => setExpandedHostel(null)}
          code={expandedHostel?.joinCode}
          hostelName={expandedHostel?.hostelName}
        />

        <AddHostelModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchHostels} 
          adminId={user?.uid}
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
