"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  Plus, Trash2, Search, Filter, Edit3, Settings2, 
  Bed, ShieldAlert, CheckCircle2, MoreVertical, LayoutGrid, List as ListIcon,
  ChevronRight, Building2, Wifi, Wind, ShowerHead, Info, Loader2
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

// --- Sub-components ---
const AmenityIcon = ({ name }) => {
  const icons = {
    WiFi: Wifi,
    AC: Wind,
    Attached: ShowerHead,
  };
  const Icon = icons[name] || Info;
  return <Icon size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors" />;
};

import { SkeletonHero, Shimmer } from "@/components/ui/Skeleton";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [floorFilter, setFloorFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const { addToast } = useToast();

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/rooms");
      setRooms(response.data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      addToast("Failed to fetch rooms.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleUpdateStatus = async (room, newStatus) => {
    try {
       await axios.put(`/api/rooms/${room._id}`, { ...room, status: newStatus });
       setRooms(rooms.map(r => r._id === room._id ? { ...r, status: newStatus } : r));
       addToast(`Room ${room.roomNumber || room.room_number} is now ${newStatus}`, "success");
    } catch (error) {
       addToast("Update failed", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
       await axios.delete(`/api/rooms/${id}`);
       setRooms(rooms.filter(room => room._id !== id));
       addToast("Room deleted successfully.", "success");
    } catch (error) {
       addToast("Failed to delete room.", "error");
    }
  };

  const openEditModal = (room) => {
    setEditingRoom({ ...room });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/rooms/${editingRoom._id}`, editingRoom);
      setRooms(rooms.map(r => r._id === editingRoom._id ? editingRoom : r));
      addToast("Room updated successfully", "success");
      setIsEditModalOpen(false);
    } catch (error) {
      addToast("Update failed", "error");
    }
  };

  const filteredRooms = useMemo(() => {
    return (rooms || []).filter((room) => {
      const rNum = (room.roomNumber || room.room_number || "").toString();
      const matchesSearch = rNum.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || room.status === statusFilter;
      const matchesFloor = floorFilter === "All" || String(room.floor || "0") === floorFilter;
      return matchesSearch && matchesStatus && matchesFloor;
    });
  }, [rooms, searchQuery, statusFilter, floorFilter]);

  const floors = useMemo(() => ["All", ...new Set((rooms || []).map(r => String(r.floor || "0")))].sort(), [rooms]);

  if (loading && rooms.length === 0) {
    return (
      <div className="p-4 sm:p-8 space-y-12 max-w-7xl mx-auto pb-32">
        <SkeletonHero />
        <Shimmer className="w-full h-24 rounded-[2.5rem]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {Array.from({ length: 8 }).map((_, i) => (
             <div key={i} className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 space-y-8">
                <div className="flex justify-between">
                  <Shimmer className="w-1/3 h-10 rounded-xl" />
                  <Shimmer className="w-1/4 h-6 rounded-lg" />
                </div>
                <Shimmer className="w-full h-20 rounded-3xl" />
                <div className="flex gap-2">
                  <Shimmer className="w-12 h-6 rounded-lg" />
                  <Shimmer className="w-12 h-6 rounded-lg" />
                </div>
                <Shimmer className="w-full h-12 rounded-2xl" />
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 sm:space-y-10 max-w-7xl mx-auto min-h-screen bg-slate-50/10 transition-all duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">Property Management</span>
           </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 sm:gap-4 italic uppercase">
            <Building2 className="text-indigo-600 w-8 h-8 sm:w-10 sm:h-10" /> Room Inventory
          </h1>
          <p className="text-slate-600 font-bold mt-2 uppercase text-[10px] sm:text-xs tracking-widest italic">Manage, allocate, and monitor hostel facility status.</p>
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/50 shadow-xl shadow-slate-100">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 sm:p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 sm:p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
          <Link
            href="/admin/rooms/new"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 rounded-2xl bg-slate-900 px-6 sm:px-10 py-3.5 sm:py-4 text-[10px] sm:text-[11px] font-bold italic uppercase tracking-widest text-white shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
          >
            <Plus size={18} /> New Asset
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/50 shadow-sm overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500 opacity-20" />
        <div className="relative col-span-1 md:col-span-2 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Lookup by room index..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-inner text-sm sm:text-base"
          />
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 sm:py-2 bg-slate-50 rounded-2xl sm:rounded-[1.5rem] border border-slate-200 shadow-inner">
           <Filter size={16} className="text-slate-400" />
           <select 
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="bg-transparent border-none text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-widest focus:ring-0 w-full cursor-pointer hover:text-slate-900 transition-colors"
           >
             <option value="All">All Status</option>
             <option value="Available">Available</option>
             <option value="Full">Full</option>
             <option value="Maintenance">Maintenance</option>
           </select>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 sm:py-2 bg-slate-50/50 rounded-2xl sm:rounded-[1.5rem] border border-slate-100 shadow-inner">
           <Building2 size={16} className="text-slate-300" />
           <select 
             value={floorFilter}
             onChange={(e) => setFloorFilter(e.target.value)}
             className="bg-transparent border-none text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest focus:ring-0 w-full cursor-pointer hover:text-slate-900 transition-colors"
           >
             <option value="All">All Floors</option>
             {floors.filter(f => f !== 'All').map(f => (
               <option key={f} value={f}>Floor {f}</option>
             ))}
           </select>
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="py-20 sm:py-32 text-center bg-white rounded-[2rem] sm:rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-4 sm:gap-6 opacity-40">
           <div className="p-6 sm:p-8 bg-slate-50 rounded-full grayscale"><Search size={60} className="text-slate-200" /></div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Negative Asset Response</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredRooms.map((room) => {
            const occupied = room.occupants?.length || (room.isOccupied ? 1 : 0);
             const rNum = (room.roomNumber || room.room_number || "??").toString().toUpperCase();
            return (
              <div 
                key={room._id} 
                className={`group bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden relative ${
                  room.status === 'Maintenance' ? 'opacity-70 grayscale-[0.8]' : ''
                }`}
              >
                <div className={`h-1.5 sm:h-2 transition-all duration-500 ${
                  room.status === 'Maintenance' ? 'bg-orange-400' :
                  room.status === 'Full' ? 'bg-rose-500' : 'bg-blue-600'
                }`}></div>
                
                <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Level {room.floor || 0}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{room.type || 'Standard'}</span>
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black text-slate-900 leading-none tracking-tighter italic group-hover:text-indigo-600 transition-colors">#{rNum}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:gap-3">
                      <div className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        room.status === 'Available' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        room.status === 'Full' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                      }`}>
                        {room.status}
                      </div>
                      <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight italic">${room.price || 0}<span className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase italic ml-1 tracking-tighter">/mo</span></span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 rounded-[1.5rem] sm:rounded-[1.75rem] p-4 sm:p-6 flex items-center justify-center gap-4 sm:gap-6 border border-slate-100 shadow-inner group-hover:bg-white group-hover:border-blue-50 transition-all duration-500">
                    {Array.from({ length: room.capacity || 1 }).map((_, idx) => (
                      <div key={idx} className="relative">
                        <Bed 
                          className={`transition-all duration-700 ${
                            idx < occupied ? 'text-blue-600 scale-110 sm:scale-125 drop-shadow-2xl' : 'text-slate-100'
                          }`} 
                          size={idx < occupied ? (window.innerWidth < 640 ? 24 : 32) : (window.innerWidth < 640 ? 20 : 32)}
                        />
                        {idx < occupied && <div className="absolute top-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-600 rounded-full border-2 border-white shadow-sm ring-4 ring-blue-50/50 animate-pulse"></div>}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {(room.amenities || ['Power Backup', 'Water', 'WiFi']).map(a => (
                      <div key={a} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 rounded-lg sm:rounded-xl group/chip hover:bg-indigo-600 hover:text-white transition-all border border-slate-100 hover:shadow-xl hover:shadow-indigo-100/20 cursor-default">
                        <AmenityIcon name={a} />
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 group-hover/chip:text-white uppercase tracking-widest">{a}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 sm:pt-8 border-t border-slate-50 flex items-center justify-between">
                    <button 
                      onClick={() => openEditModal(room)}
                      className="flex-1 mr-4 flex items-center justify-center gap-3 py-3 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-indigo-500/10 hover:bg-indigo-600 transition-all active:scale-95"
                    >
                      <Edit3 size={16} /> Edit Asset
                    </button>
                    
                    <div className="relative group/menu">
                      <button className="p-3 sm:p-4 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition-all">
                        <MoreVertical size={20} />
                      </button>
                      
                      <div className="absolute right-0 bottom-full mb-4 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 z-20 overflow-hidden">
                        <button 
                          onClick={() => handleUpdateStatus(room, room.status === 'Maintenance' ? 'Available' : 'Maintenance')}
                          className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-3"
                        >
                          <Settings2 size={16} className={room.status === 'Maintenance' ? 'text-orange-500' : 'text-slate-400'} /> 
                          {room.status === 'Maintenance' ? 'RESUME OPS' : 'MAINTENANCE'}
                        </button>
                        <button 
                          onClick={() => handleDelete(room._id)}
                          className="w-full px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 flex items-center gap-3 border-t border-slate-50"
                        >
                          <Trash2 size={16} /> PURGE ASSET
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-200/50 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-rose-500 opacity-20" />
           <div className="overflow-x-auto no-scrollbar">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 grayscale-[50%]">
                   <th className="px-6 sm:px-10 py-6 sm:py-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest italic">Identity Descriptor</th>
                   <th className="hidden md:table-cell px-8 py-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest italic">Allocation Tier</th>
                   <th className="hidden sm:table-cell px-8 py-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest italic text-center">Velocity</th>
                   <th className="hidden lg:table-cell px-8 py-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest italic">Market Rate</th>
                   <th className="px-6 sm:px-8 py-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest italic">Clearance</th>
                   <th className="px-6 sm:px-10 py-8 text-right"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {filteredRooms.map(room => (
                   <tr key={room._id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                     <td className="px-6 sm:px-10 py-6 sm:py-8">
                        <div className="flex items-center gap-3 sm:gap-5">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-300 text-lg sm:text-xl group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all duration-500 shadow-sm">
                               #
                            </div>
                            <div>
                               <p className="text-lg sm:text-xl font-black text-slate-900 italic tracking-tighter group-hover:text-indigo-600 transition-colors uppercase">{(room.roomNumber || room.room_number || "???").toString().substring(0, 4)}</p>
                               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{room.type || 'Standard'} Unit</span>
                            </div>
                        </div>
                     </td>
                     <td className="hidden md:table-cell px-8 py-8">
                       <span className="px-4 py-2 bg-slate-100/50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 italic">Level {room.floor || 0}</span>
                     </td>
                     <td className="hidden sm:table-cell px-8 py-8">
                        <div className="flex flex-col gap-2 max-w-[140px] mx-auto">
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  (room.occupants?.length || 0) >= (room.capacity || 1) ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                                }`}
                                style={{ width: `${Math.min(100, Math.round(((room.occupants?.length || (room.isOccupied ? 1 : 0)) / (room.capacity || 1)) * 100))}%` }}
                              />
                           </div>
                           <p className="text-[9px] sm:text-[10px] font-black text-center text-slate-300 uppercase tracking-widest">{room.occupants?.length || (room.isOccupied ? 1 : 0)} / {room.capacity || 1} Occupancy</p>
                        </div>
                     </td>
                     <td className="hidden lg:table-cell px-8 py-8">
                        <span className="text-lg font-bold text-slate-900 italic tracking-tighter group-hover:text-indigo-600 transition-colors">${room.price || 0}</span>
                     </td>
                     <td className="px-6 sm:px-8 py-8">
                        <span className={`inline-flex items-center gap-2 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                          room.status === 'Available' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          room.status === 'Full' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${room.status === 'Available' ? 'bg-blue-600' : 'bg-current'} animate-pulse`} />
                          <span className="hidden sm:inline">{room.status}</span>
                          <span className="sm:hidden">{room.status.charAt(0)}</span>
                        </span>
                     </td>
                     <td className="px-6 sm:px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-2 sm:gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                           <button onClick={() => openEditModal(room)} className="p-2 sm:p-3 bg-white border border-slate-100 text-slate-300 hover:text-blue-600 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl active:scale-90 transition-all"><Edit3 size={16} /></button>
                           <button onClick={() => handleDelete(room._id)} className="p-2 sm:p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl active:scale-90 transition-all"><Trash2 size={16} /></button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="absolute inset-0" onClick={() => setIsEditModalOpen(false)} />
           <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] w-full max-w-xl p-8 sm:p-16 relative overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200">
              <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600 shadow-[0_4px_24px_rgba(79,70,229,0.4)]"></div>
              <div className="mb-8 sm:mb-10 text-center">
                 <h2 className="text-2xl sm:text-4xl font-black text-slate-900 italic tracking-tight uppercase leading-none">Modify Asset #{editingRoom.roomNumber || editingRoom.room_number || "??"}</h2>
                 <p className="text-indigo-600 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-3 sm:mt-4">Registry Specification Tuning</p>
              </div>
              
              <form onSubmit={handleEditSubmit} className="space-y-6 sm:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                   <div className="space-y-2 sm:space-y-3">
                      <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-2">Asset Identifier</label>
                      <input 
                         type="text" 
                         required
                         value={editingRoom.roomNumber || editingRoom.room_number || ""} 
                         onChange={(e) => setEditingRoom({...editingRoom, roomNumber: e.target.value, room_number: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl sm:rounded-[1.5rem] px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-bold text-slate-900 focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner tracking-tighter italic"
                      />
                   </div>
                   <div className="space-y-2 sm:space-y-3">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Floor Level</label>
                      <input 
                        type="number" 
                        required
                        value={editingRoom.floor || 0} 
                        onChange={(e) => setEditingRoom({...editingRoom, floor: parseInt(e.target.value)})}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl sm:rounded-[1.5rem] px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-black text-slate-900 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:bg-white transition-all shadow-inner tracking-tighter italic"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                   <div className="space-y-2 sm:space-y-3">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Monthly Fee ($)</label>
                      <input 
                        type="number" 
                        required
                        value={editingRoom.price || 0} 
                        onChange={(e) => setEditingRoom({...editingRoom, price: parseInt(e.target.value)})}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl sm:rounded-[1.5rem] px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-black text-slate-900 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:bg-white transition-all shadow-inner tracking-tighter italic"
                      />
                   </div>
                   <div className="space-y-2 sm:space-y-3">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Operational Status</label>
                      <select 
                        value={editingRoom.status || "Available"} 
                        onChange={(e) => setEditingRoom({...editingRoom, status: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl sm:rounded-[1.5rem] px-6 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:bg-white transition-all cursor-pointer shadow-inner uppercase tracking-widest appearance-none"
                      >
                        <option value="Available">Validated Available</option>
                        <option value="Full">Maximum Capacity</option>
                        <option value="Maintenance">Institutional Maintenance</option>
                      </select>
                   </div>
                </div>

                 <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 sm:pt-6">
                   <button 
                     type="button"
                     onClick={() => setIsEditModalOpen(false)}
                     className="order-2 sm:order-1 flex-1 py-4 sm:py-6 px-8 sm:px-10 rounded-xl sm:rounded-2xl bg-slate-50 text-slate-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest border border-slate-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                   >
                     Discard
                   </button>
                   <button 
                     type="submit"
                     className="order-1 sm:order-2 flex-[2] py-4 sm:py-6 px-8 sm:px-10 rounded-2xl sm:rounded-[2rem] bg-slate-900 text-white text-[11px] sm:text-[12px] font-bold uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-600 transition-all active:scale-95 italic text-center"
                   >
                     Commit Changes
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
