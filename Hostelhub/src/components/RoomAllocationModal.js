"use client";

import { useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Search, UserPlus, ShieldCheck, ArrowRight, 
  Loader2, Maximize2, Monitor, Users, CheckCircle2
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function RoomAllocationModal({ isOpen, onClose, room, onSuccess }) {
  const { addToast } = useToast();
  const { activeHostelId } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch unallocated students
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['unallocated-students', activeHostelId],
    queryFn: async () => {
      const res = await axios.get("/api/students", { params: { hostelId: activeHostelId } });
      return (res.data.students || []).filter(s => !s.roomNumber);
    },
    enabled: isOpen && !!activeHostelId,
  });

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const handleAllocate = async (studentId) => {
    if (!room || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/allocations", { 
        roomId: room.id, 
        studentId,
        hostelId: activeHostelId
      });
      addToast("Resident connected to node.", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || "Allocation failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="bg-white w-full max-w-4xl rounded-[4rem] shadow-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[95vh]"
      >
        <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl">
              <UserPlus size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">NODE INITIATION</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-black mt-2 italic">Spatial Unit {room?.roomNumber} Allocation Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center shadow-sm">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 bg-white border-b border-slate-100 no-print">
          <div className="relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="PROBE UNALLOCATED RESIDENT ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] text-[12px] font-black uppercase tracking-widest text-slate-700 placeholder:text-slate-300 italic focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
          {loadingStudents ? (
            <div className="flex flex-col items-center py-24 gap-6">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Extracting Unallocated Nodes...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-slate-300 gap-8 opacity-30">
              <Monitor size={64} />
              <p className="font-black uppercase tracking-[0.4em] text-[12px] italic">No Synchronization Markers Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredStudents.map((student) => (
                <motion.div 
                  key={student.id}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-white flex items-center justify-center text-slate-400 text-sm font-black italic border border-slate-100 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                      {student.name?.[0]}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight group-hover:text-indigo-600 transition-all">{student.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{student.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAllocate(student.id)}
                    disabled={isSubmitting}
                    className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-90"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
            <ShieldCheck size={16} className="text-indigo-500" /> Integrity maintained through institutional core.
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-12 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 hover:text-white transition-all italic shadow-sm"
          >
            ABORT PROTOCOL
          </button>
        </div>
      </motion.div>
    </div>
  );
}
