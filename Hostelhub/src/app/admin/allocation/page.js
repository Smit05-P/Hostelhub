"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Bed, CheckCircle2, XCircle, SearchIcon,
  Filter, LayoutGrid, List, SlidersHorizontal, Loader2,
  Activity, Shield, Zap, Sparkles, Building, UserPlus,
  ArrowRight, Maximize2, Monitor
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import RoomAllocationModal from "@/components/RoomAllocationModal";

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

const RoomCard = ({ room, onAllocate, onDeallocate }) => {
  const occupied = room.occupants?.length || 0;
  const isFull = occupied >= (room.capacity || 1);
  const occupancyPct = (occupied / (room.capacity || 1)) * 100;

  return (
    <motion.div
      variants={ITEM_VARIANTS}
      whileHover={{ y: -5, scale: 1.01 }}
      className="premium-glass rounded-[2rem] border border-slate-200/60 overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10"
    >
      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none text-highlight">Spatial Node</span>
                <div className={`w-2 h-2 rounded-full ${isFull ? 'bg-slate-400' : 'bg-indigo-600 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]'}`} />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">UNIT {room.roomNumber}</h3>
          </div>
          <div className={`p-4 rounded-2xl ${isFull ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'} border border-white/20`}>
             <Bed size={22} strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-5 mb-10">
           <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 italic">
              <span>Occupancy Spectrum</span>
              <span>{occupied} / {room.capacity} Locked</span>
           </div>
           <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner p-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${occupancyPct}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className={`h-full rounded-full ${isFull ? 'bg-slate-900' : 'bg-indigo-600'}`} 
              />
           </div>
           
           <div className="flex flex-wrap gap-2.5">
              {room.occupants?.map((occ, idx) => (
                <div key={idx} className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 group/occ hover:bg-white hover:border-indigo-200 transition-all shadow-sm">
                   <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-[11px] font-black text-white italic">
                      {occ.name?.[0] || 'R'}
                   </div>
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter italic">{occ.name}</span>
                   <button 
                     onClick={() => onDeallocate(room.id, occ.studentId)}
                     className="ml-1 text-slate-300 hover:text-rose-500 transition-colors"
                   >
                     <XCircle size={14} />
                   </button>
                </div>
              ))}
              {!isFull && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 italic animate-pulse">
                   <UserPlus size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Connect Open</span>
                </div>
              )}
           </div>
        </div>

        <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between gap-4">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Tier Vector</span>
              <span className="text-[12px] font-black text-slate-900 uppercase italic mt-1.5">{room.roomType}</span>
           </div>
           <button 
             onClick={() => onAllocate(room)}
             disabled={isFull}
             className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all italic shadow-2xl ${isFull ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-indigo-600 hover:scale-105 active:scale-95 shadow-indigo-500/20'}`}
           >
             {isFull ? "MAX LOAD" : "INITIATE"} <ArrowRight size={16} />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function AdminAllocationPage() {
  const { addToast } = useToast();
  const { activeHostelId } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    if (!activeHostelId) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/rooms", { params: { hostelId: activeHostelId } });
      setRooms(res.data || []);
    } catch (err) {
      addToast("Failed to sync spatial data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, [activeHostelId]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.roomNumber?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || room.roomType === typeFilter;
      const isFull = (room.occupants?.length || 0) >= (room.capacity || 1);
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "available" && !isFull) || 
        (statusFilter === "full" && isFull);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rooms, searchQuery, typeFilter, statusFilter]);

  const handleAllocate = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleDeallocate = async (roomId, studentId) => {
    if (!window.confirm("Disconnect resident from this node?")) return;
    try {
      await axios.post("/api/rooms/deallocate", { roomId, studentId });
      addToast("Resident disconnected.", "success");
      fetchRooms();
    } catch (err) {
      addToast("Disconnection failed.", "error");
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-8">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20"
        >
          <LayoutGrid size={36} />
        </motion.div>
        <p className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-400 italic">Mapping Spatial Nodes...</p>
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
               Institutional Spatial core
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none flex items-center gap-5">
               <Maximize2 size={48} className="text-indigo-600" /> ALLOCATION GRID
            </h1>
            <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.3em] mt-5 italic leading-none opacity-80">Mapping residents to institutional spatial zones</p>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-xl">
            <div className="relative group w-full sm:w-72">
               <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search Node ID..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-14 pr-8 py-4 bg-transparent border-none focus:ring-0 text-[12px] font-black uppercase tracking-widest text-slate-700 placeholder:text-slate-300 italic"
               />
            </div>
            <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase tracking-widest text-slate-600 cursor-pointer appearance-none px-8 italic"
            >
              <option value="all">ALL TIERS</option>
              <option value="Single">SINGLE UNIT</option>
              <option value="Double">DOUBLE UNIT</option>
              <option value="Triple">TRIPLE UNIT</option>
            </select>
            <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase tracking-widest text-slate-600 cursor-pointer appearance-none px-8 italic"
            >
              <option value="all">ANY STATE</option>
              <option value="available">OPEN NODES</option>
              <option value="full">PEAK LOAD</option>
            </select>
         </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Total Nodes", value: rooms.length, color: "bg-indigo-600" },
           { label: "Active Nodes", value: rooms.filter(r => r.occupants?.length > 0).length, color: "bg-slate-900" },
           { label: "Peak Units", value: rooms.filter(r => (r.occupants?.length || 0) >= (r.capacity || 1)).length, color: "bg-indigo-400" },
           { label: "Spatial Availability", value: rooms.filter(r => (r.occupants?.length || 0) < (r.capacity || 1)).length, color: "bg-indigo-300" }
         ].map((stat, i) => (
           <motion.div 
             key={i} 
             variants={ITEM_VARIANTS}
             className="premium-glass p-8 rounded-[2.5rem] border border-slate-200/60 flex items-center justify-between shadow-lg"
           >
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">{stat.label}</span>
                 <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${stat.color} bg-opacity-10 flex items-center justify-center text-slate-900 border border-white/20 shadow-inner italic`}>
                 <Activity size={18} className={stat.color.replace('bg-', 'text-')} />
              </div>
           </motion.div>
         ))}
      </div>

      {/* Grid Area */}
      <div className="bg-slate-50/50 rounded-[4rem] border border-slate-100 p-12 shadow-inner">
         {filteredRooms.length === 0 ? (
           <div className="py-32 flex flex-col items-center justify-center gap-8 opacity-20">
              <Monitor size={80} className="text-slate-400" />
              <p className="font-black uppercase tracking-[0.5em] text-[14px] text-slate-400 italic">No Synchronization Markers Match Filters</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              <AnimatePresence mode="popLayout">
                {filteredRooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    onAllocate={handleAllocate}
                    onDeallocate={handleDeallocate}
                  />
                ))}
              </AnimatePresence>
           </div>
         )}
      </div>

      <RoomAllocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={selectedRoom}
        onSuccess={fetchRooms}
      />
    </motion.div>
  );
}
