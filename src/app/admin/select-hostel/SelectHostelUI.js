"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Hotel, 
  Building2, 
  ArrowRight, 
  Search, 
  Loader2, 
  LogOut,
  Bell,
  Plus,
  ShieldCheck,
  Users,
  Activity,
  CheckCircle2,
  LayoutDashboard,
  Building,
  Sparkles,
  Zap,
  Globe,
  Cpu,
  Layers,
  ArrowUpRight,
  ChevronRight,
  LogOutIcon
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SelectHostelUI() {
  const { switchHostel, logout, userData, activeHostelId, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: hostels = [], isLoading: loading } = useQuery({
    queryKey: ["hostels", (user?._id || user?.id || user?.uid)],
    queryFn: async () => {
      if (!(user?._id || user?.id || user?.uid)) return [];
      const res = await fetch(`/api/hostels?adminId=${(user?._id || user?.id || user?.uid)}`);
      if (!res.ok) throw new Error("Failed to fetch hostels");
      return res.json();
    },
    enabled: !!(user?._id || user?.id || user?.uid),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (hostels.length === 1 && !activeHostelId) {
      switchHostel(hostels[0].id);
    }
  }, [hostels, activeHostelId, switchHostel]);

  const filteredHostels = useMemo(() => 
    hostels.filter(h => 
      h.hostelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [hostels, searchTerm]
  );

  const stats = useMemo(() => {
    const totalFacilities = hostels.length;
    const totalStudents = hostels.reduce((acc, h) => acc + (h.totalStudents || 0), 0);
    const totalCapacity = hostels.reduce((acc, h) => acc + (parseInt(h.capacity) || 0), 0);
    return { totalFacilities, totalStudents, totalCapacity };
  }, [hostels]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Building2 size={24} className="text-indigo-600 animate-pulse" />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-500/30">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Building2 size={20} />
             </div>
             <span className="text-xl font-bold text-slate-900 tracking-tight">HostelHub <span className="text-indigo-600">Admin</span></span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-rose-600 font-bold transition-all text-sm rounded-lg hover:bg-rose-50"
            >
              Sign Out <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 pt-32 pb-20 space-y-16">
        
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
               <Sparkles size={12} className="text-indigo-600" />
               <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Organization Overview</span>
            </div>
            <h1 className="text-5xl font-bold text-slate-900 tracking-tight">
              Welcome, <span className="text-indigo-600">{userData?.name?.split(" ")[0] || "Admin"}</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Select a property to manage operations, resident allocations, and financial records for your hostel network.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center min-w-[200px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Properties Managed</p>
                <div className="flex items-center justify-between">
                   <p className="text-3xl font-bold text-slate-900">{stats.totalFacilities}</p>
                   <div className="w-10 h-10 bg-indigo-50 rounded-lg text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                      <Building2 size={18} />
                   </div>
                </div>
             </div>
             <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col justify-center min-w-[200px]">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Residents</p>
                <div className="flex items-center justify-between text-white">
                   <p className="text-3xl font-bold">{stats.totalStudents}</p>
                   <div className="w-10 h-10 bg-white/10 rounded-lg text-white flex items-center justify-center border border-white/10">
                      <Users size={18} />
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Property Grid */}
        <div className="space-y-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                 <Globe size={20} className="text-indigo-600" /> Property Portfolio
              </h2>
              
              <div className="relative group max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search properties..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300 shadow-sm"
                />
              </div>
           </div>

           {filteredHostels.length === 0 ? (
              <div className="py-24 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center p-12">
                 <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                    <Building size={32} className="text-slate-300" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">No properties found</h3>
                 <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm">No properties match your current search criteria or have been registered yet.</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredHostels.map((hostel, idx) => {
                  const active = activeHostelId === hostel.id;
                  return (
                    <motion.div 
                      key={hostel.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`bg-white p-8 rounded-3xl border transition-all duration-300 group relative flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                        active 
                          ? 'border-indigo-500/40 shadow-indigo-100 ring-4 ring-indigo-500/5' 
                          : 'border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                       <div className="flex items-start justify-between mb-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100'}`}>
                            <Hotel size={28} />
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${active ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
                             {active ? 'Session Active' : 'Connected'}
                          </div>
                       </div>

                       <div className="flex-1 space-y-6">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors line-clamp-2">{hostel.hostelName}</h3>
                            <div className="flex items-center gap-1.5 text-slate-400 mt-2">
                               <MapPin size={12} className="text-slate-300" />
                               <span className="text-[10px] font-bold uppercase tracking-wider truncate">{hostel.address || "Main Campus Location"}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                             <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Residents</p>
                                <div className="flex items-center gap-1.5">
                                   <Users size={14} className="text-indigo-500" />
                                   <span className="text-sm font-bold text-slate-700">{hostel.totalStudents || 0}</span>
                                </div>
                             </div>
                             <div>
                                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Units</p>
                                <div className="flex items-center gap-1.5">
                                   <LayoutDashboard size={14} className="text-indigo-500" />
                                   <span className="text-sm font-bold text-slate-700">{hostel.roomsCount || 0}</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="mt-8">
                          <button 
                            onClick={() => switchHostel(hostel.id)}
                            className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
                              active 
                                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                            }`}
                          >
                             Enter Dashboard
                             <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                       </div>

                       {active && (
                         <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle2 size={18} className="text-indigo-600" />
                         </div>
                       )}
                    </motion.div>
                  );
                })}
              </div>
           )}
        </div>

        {/* Infrastructure Footer */}
        <footer className="pt-20 pb-10">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-t border-slate-200 pt-12">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                   <ShieldCheck size={24} className="text-indigo-600" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Enterprise Management v5.0</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Secure Administrative Environment</p>
                 </div>
              </div>
              <div className="text-right">
                 <div className="flex items-center gap-3 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    Property Services Operational
                 </div>
                 <p className="text-[9px] font-medium text-slate-300 uppercase tracking-tighter mt-1">Instance Secure: {(user?._id || user?.id || user?.uid)?.slice(-16).toUpperCase()}</p>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}

// Minimal missing icons
const MapPin = ({ size, className }) => <Building2 size={size} className={className} />;
