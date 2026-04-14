"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { getAllHostels } from "@/lib/firestore";
import { 
  Hotel, 
  MapPin, 
  Building2, 
  ArrowRight, 
  Search, 
  Loader2, 
  LogOut,
  ChevronRight,
  Bell,
  Plus,
  ShieldCheck,
  Users,
  Activity,
  CheckCircle2,
  Command,
  LayoutDashboard,
  Building
} from "lucide-react";

export default function HostelSelectionPage() {
  const { switchHostel, logout, userData, activeHostelId } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllHostels();
        setHostels(data);
        
        // Auto-select if only one hostel and none selected yet
        if (data.length === 1 && !activeHostelId) {
          switchHostel(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load hostels:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [switchHostel, activeHostelId]);

  const filteredHostels = useMemo(() => 
    hostels.filter(h => 
      h.hostelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [hostels, searchTerm]
  );

  const stats = useMemo(() => {
    const totalFacilities = hostels.length;
    const totalStudents = hostels.reduce((acc, h) => acc + (h.totalStudents || 0), 0) || 42;
    const operationalSites = hostels.filter(h => h.status !== "Inactive").length;
    return { totalFacilities, totalStudents, operationalSites };
  }, [hostels]);

  const activeHostel = useMemo(() => 
    hostels.find(h => h.id === activeHostelId), 
    [hostels, activeHostelId]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050D1A] text-blue-500 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <p className="font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050D1A] text-white font-jakarta selection:bg-blue-500/30 overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-[100] premium-glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-xl font-black tracking-tighter leading-none">HostelHub</h2>
          </div>
        </div>

        {/* Center: Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Administrator Control Panel</span>
        </div>

        {/* Right: Profile & Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          {activeHostel && (
            <div className="hidden lg:flex items-center gap-3 pl-3 pr-1 py-1 bg-white/5 border border-white/10 rounded-full">
              <span className="text-[11px] font-bold text-slate-300 max-w-[150px] truncate">{activeHostel.hostelName}</span>
              <button 
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full transition-all active:scale-95"
                onClick={() => {}}
              >
                Switch
              </button>
            </div>
          )}

          <div className="relative group cursor-pointer">
            <Bell size={20} className="text-slate-400 group-hover:text-white transition-colors" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-[#0D1B2E] rounded-full flex items-center justify-center text-[8px] font-bold">3</span>
          </div>

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold leading-none">{userData?.name || "Admin User"}</span>
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-1">Super Admin</span>
            </div>
            <div className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center bg-slate-800 overflow-hidden shadow-xl">
               {userData?.photoURL ? (
                 <div className="relative w-full h-full">
                    <Image 
                      src={userData.photoURL} 
                      alt="Avatar" 
                      fill
                      className="object-cover"
                    />
                 </div>
               ) : (
                 <Users size={18} className="text-slate-500" />
               )}
            </div>
          </div>

          <button 
            onClick={logout}
            className="p-2.5 bg-white/5 hover:bg-red-500 text-slate-400 hover:text-white rounded-xl border border-white/10 hover:border-red-500/50 transition-all font-bold group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24">
        
        {/* HERO */}
        <section className="animate-fade-in space-y-10 mb-20">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.85]">
              Welcome back,<br />
              <span className="animate-name-gradient">{userData?.name || "Chief Admin"}</span>.
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
              Manage your hostel facilities from one powerful dashboard. Analyze resident load and deploy new site updates.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search facilities..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-4.5 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block transition-all placeholder:text-slate-500 text-base"
              />
            </div>
            <button className="w-full md:w-auto h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:-translate-y-1 active:scale-95 shrink-0">
              <Plus size={22} />
              Register New Hostel
            </button>
          </div>
        </section>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="premium-glass p-8 rounded-[2.5rem] border border-blue-500/10 hover:border-blue-500/30 transition-all group relative overflow-hidden">
             <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
             <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
               <Building2 size={28} />
             </div>
             <div className="space-y-1 relative z-10">
                <p className="text-4xl font-black tracking-tight">{stats.totalFacilities}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Facilities</p>
             </div>
          </div>

          <div className="premium-glass p-8 rounded-[2.5rem] border border-blue-600/10 hover:border-blue-600/30 transition-all group relative overflow-hidden">
             <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-colors" />
             <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 mb-6 border border-blue-600/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
               <Users size={28} />
             </div>
             <div className="space-y-1 relative z-10">
                <p className="text-4xl font-black tracking-tight">{stats.totalStudents}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Students Enrolled</p>
             </div>
          </div>

          <div className="premium-glass p-8 rounded-[2.5rem] border border-purple-500/10 hover:border-purple-500/30 transition-all group relative overflow-hidden sm:col-span-2 lg:col-span-1">
             <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
             <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
               <Activity size={28} />
             </div>
             <div className="space-y-1 relative z-10">
                <p className="text-4xl font-black tracking-tight">{stats.operationalSites}</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Operational Sites</p>
             </div>
          </div>
        </div>

        {/* HOSTEL GRID */}
        {filteredHostels.length === 0 ? (
          <div className="py-32 text-center animate-fade-in flex flex-col items-center max-w-sm mx-auto">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 group">
                <Building size={48} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
             </div>
             <h3 className="text-2xl font-black text-white mb-2 underline decoration-blue-500 decoration-4 underline-offset-8">No hostels found</h3>
             <p className="text-slate-500 font-medium leading-relaxed mb-10">
               Register your first hostel facility to begin managing infrastructure and student intake.
             </p>
             <button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                <Plus size={18} />
                Register New Hostel
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {filteredHostels.map((hostel, idx) => {
              const active = activeHostelId === hostel.id;
              return (
                <div 
                  key={hostel.id}
                  className={`premium-glass p-8 rounded-[2.5rem] border relative flex flex-col premium-card-hover group animate-fade-in ${active ? 'border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.2)]' : 'border-white/5'}`}
                  style={{ animationDelay: `${0.1 + (idx * 0.08)}s` }}
                >
                   {/* Top: Avatar & Status */}
                   <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-500 shadow-lg">
                        <Hotel size={28} />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full">
                         <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Site Active</span>
                      </div>
                   </div>

                   <div className="flex-1 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight truncate">{hostel.hostelName}</h3>
                        <div className="flex items-center gap-2 text-slate-500">
                           <Command size={12} className="text-blue-500" />
                           <span className="text-xs font-bold uppercase tracking-widest">{hostel.ownerName || "Global Group"}</span>
                           <div className="w-1 h-1 bg-blue-600 rounded-full" />
                        </div>
                      </div>

                      <div className="h-[1px] w-full bg-white/5" />

                      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                         <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Live Load</p>
                            <div className="flex items-center gap-2">
                               <Users size={14} className="text-blue-400" />
                               <span className="text-sm font-bold">{hostel.totalStudents || 0} Residents</span>
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Facility ID</p>
                            <div className="flex items-center gap-2">
                               <LayoutDashboard size={14} className="text-purple-400" />
                               <span className="text-[10px] font-mono font-bold uppercase p-1 bg-white/5 rounded border border-white/10">{hostel.id.slice(-8)}</span>
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Total Rooms</p>
                            <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-xs font-bold">{hostel.roomsCount || 24} Units</span>
                         </div>
                         <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Available Beds</p>
                            <span className="inline-block px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-lg text-blue-500 text-xs font-bold">{hostel.availableBeds || 8} Spaces</span>
                         </div>
                      </div>
                   </div>

                   {/* Footer: Actions */}
                   <div className="mt-10 pt-4 flex items-center justify-between gap-4">
                      <button 
                        onClick={() => switchHostel(hostel.id)}
                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-500/20 group active:scale-95"
                      >
                         Manage Site
                         <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button className="flex-1 h-12 border border-white/10 hover:border-white/20 hover:bg-white/5 text-slate-300 font-bold text-sm rounded-xl transition-all active:scale-95">
                         View Details
                      </button>
                   </div>

                   {active && (
                     <div className="absolute -top-3 -right-3 w-10 h-10 bg-blue-600 border-4 border-[#050D1A] rounded-full flex items-center justify-center shadow-xl">
                        <CheckCircle2 size={24} className="text-white" />
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                <ShieldCheck size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em]">HostelHub Cloud Architecture v4.2</p>
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Node Cluster: Asia Pacific-Southwest (Mumbai)</p>
        </footer>
      </main>
    </div>
  );
}
