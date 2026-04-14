"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Loader2, BedDouble, DollarSign, MessageSquare, 
  CheckCircle, AlertTriangle, Clock, Hash, Users,
  Calendar, Building2, ShieldCheck, ArrowRight, Info,
  Sparkles, Zap, Heart, Star, CreditCard, RefreshCw,
  LayoutDashboard, UserCircle, MapPin, ZapOff, Activity
} from "lucide-react";
import Link from "next/link";
import IntelInsightCard from "@/components/intel/IntelInsightCard";
import { motion, AnimatePresence } from "framer-motion";

const InfoCard = ({ icon: Icon, label, value, sub, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay / 1000 }}
    className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:shadow-2xl hover:border-indigo-500/20 transition-all duration-500 relative overflow-hidden group"
  >
    <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[60px] opacity-10 rounded-full transition-transform duration-700 group-hover:scale-150 ${colorClass}`} />
    
    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className={`w-12 h-12 rounded-2xl ${colorClass.replace('bg-', 'text-').split(' ')[0]} bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center transition-transform duration-500 group-hover:rotate-6`}>
        <Icon size={20} className="text-inherit" strokeWidth={2.5} />
      </div>
      <h4 className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] italic">{label}</h4>
    </div>
    
    <div className="relative z-10">
      <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1 uppercase italic">{value}</p>
      {sub && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">{sub}</p>}
    </div>
  </motion.div>
);

export default function StudentDashboardPage() {
  const { user, hostelStatus, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [room, setRoom] = useState(null);
  const [fees, setFees] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || hostelStatus === "PENDING_APPROVAL") {
       setLoading(false);
       return;
    }
    
    async function fetchAll() {
      setLoading(true);
      try {
        let pData = null;
        const profileRes = await axios.get(`/api/students/${user.uid}`);
        pData = profileRes.data;
        setProfile(pData);

        const promises = [];
        if (pData?.assignedRoomId) {
          promises.push(axios.get(`/api/rooms/${pData.assignedRoomId}`).catch(() => ({ data: null })));
        } else {
          promises.push(Promise.resolve({ data: null }));
        }
        
        promises.push(axios.get(`/api/fees?studentId=${user.uid}`).catch(() => ({ data: [] })));
        promises.push(axios.get(`/api/complaints?studentId=${user.uid}`).catch(() => ({ data: [] })));

        const [roomRes, feesRes, complaintsRes] = await Promise.all(promises);
        setRoom(roomRes?.data || null);
        setFees(feesRes?.data || []);
        setComplaints(complaintsRes?.data || []);
      } catch (err) {
        console.error("Student dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [user, hostelStatus]);

  const now = new Date();
  const currentFee = fees.find(f => f.month === now.getMonth() + 1 && f.year === now.getFullYear());

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-8">
        <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
        <div className="text-center space-y-2">
           <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Syncing Profile</p>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Connecting to the resident network hub...</p>
        </div>
      </div>
    );
  }

  // Handle case where user status is not APPROVED
  if (hostelStatus !== "APPROVED") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full text-center space-y-12"
          >
            <div className="relative inline-block">
               <div className="w-40 h-40 bg-white rounded-[4rem] shadow-2xl border border-slate-200 flex items-center justify-center mx-auto text-indigo-600">
                  <UserCircle size={80} strokeWidth={1.5} />
               </div>
               <motion.div 
                 animate={{ scale: [1, 1.2, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="absolute -bottom-2 -right-2 w-16 h-16 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl border-8 border-white"
               >
                  <Clock size={28} />
               </motion.div>
            </div>
            
            <div className="space-y-6">
               <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase italic">
                 Security <span className="text-amber-500">Holt</span>
               </h2>
               <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                 Your resident credentials are under administrative review. Access to the core network is currently restricted.
               </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
               <button 
                onClick={() => refreshUser()}
                className="h-16 px-10 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 group"
               >
                 <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                 Synchronize Identity
               </button>
               <Link href="/student/profile" className="h-16 px-10 bg-white text-slate-900 border border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-4 shadow-xl shadow-slate-500/5">
                 Update Profile
               </Link>
            </div>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-24 p-4 sm:p-0 animate-in fade-in duration-1000">
      
      {/* Student Hero */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[3.5rem] bg-slate-900 p-12 sm:p-16 lg:p-20 text-white shadow-2xl shadow-indigo-500/20 group"
      >
        <div className="absolute top-0 right-0 w-[800px] h-full bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-1000" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-2xl">
               <Activity size={14} className="text-emerald-400 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Network Active : Resident #{user?.uid?.slice(-4)}</span>
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-none italic uppercase">
              Hello, <span className="text-indigo-400">{profile?.name?.split(" ")[0] || "Resident"}</span>
            </h1>
            <p className="text-xl sm:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl">
              Welcome to the Hub. You are currently established in <span className="text-white font-black italic">{room ? `Room Alpha ${room.roomNumber}` : 'Establishing Void...'}</span>.
            </p>
          </div>

          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-6 shrink-0">
             <div className={`h-16 px-10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-4 transition-all duration-500 ${room ? 'bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-500/20' : 'bg-amber-600/10 text-amber-500 border-amber-500/20 shadow-none'}`}>
                {room ? <ShieldCheck size={18} /> : <Clock size={18} className="animate-spin" />}
                {room ? "Linked" : "Establishing Link"}
             </div>
             {currentFee && (
                <div className={`h-16 px-10 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-4 backdrop-blur-md ${currentFee.status === 'Paid' ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-rose-500 text-white border-rose-400 shadow-xl shadow-rose-500/20'}`}>
                   <Activity size={18} />
                   {currentFee.status} Stream
                </div>
             )}
          </div>
        </div>
      </motion.section>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <InfoCard icon={LayoutDashboard} label="Link Terminal" value={room ? room.roomNumber : "VOID"} sub={room ? "Active Resident Node" : "Searching for open node..."} colorClass="bg-indigo-600" delay={100} />
        <InfoCard icon={Building2} label="Hostel Sector" value="Bloc Alpha" sub="Institutional Sector 01" colorClass="bg-emerald-500" delay={200} />
        <InfoCard icon={Users} label="Node Density" value={room ? `${room.capacity}` : "N/A"} sub="Resident capacity count" colorClass="bg-blue-600" delay={300} />
        <InfoCard icon={ShieldCheck} label="Account Trust" value="Verified" sub="Security clearing: Level 1" colorClass="bg-amber-500" delay={400} />
      </div>

       {/* AI Proactive Insight */}
       <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 0.6 }}
       >
         <IntelInsightCard hostelId={user?.hostelId || profile?.hostelId} role="student" title="Central Intel Insight" />
       </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          
          {/* Billing Overview */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-500/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full -z-10" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-16">
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Billing <span className="text-indigo-600">Ledger</span></h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                  <CreditCard size={14} className="text-indigo-500" /> Network transaction stream : Academic Year {now.getFullYear()}
                </p>
              </div>
              <Link href="/student/payments" className="h-12 px-8 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] text-slate-800 hover:bg-slate-900 hover:text-white transition-all">
                Full Network Ledger
              </Link>
            </div>
            
            <div className="space-y-6">
              {fees.length === 0 ? (
                <div className="flex flex-col items-center py-24 text-slate-300 gap-6 grayscale">
                  <ZapOff size={64} className="opacity-20 animate-pulse" />
                  <div className="text-center space-y-2">
                    <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">No Stream Detected</p>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-40">Financial transaction history is currently null.</p>
                  </div>
                </div>
              ) : (
                fees.slice(0, 4).map((fee) => (
                  <motion.div 
                    whileHover={{ x: 10 }}
                    key={fee.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 hover:border-indigo-200 transition-all group gap-8"
                  >
                    <div className="flex items-center gap-8">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl group-hover:scale-110 duration-500 ${fee.status === 'Paid' ? 'bg-white text-emerald-500 border border-emerald-100' : 'bg-white text-rose-500 border border-rose-100'}`}>
                          {fee.status === 'Paid' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                       </div>
                       <div>
                          <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                            {["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][(fee.month||1)-1]} {fee.year}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Resource Allocation Rent</p>
                       </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-10 w-full sm:w-auto border-t sm:border-t-0 pt-6 sm:pt-0">
                       <span className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">${fee.amount?.toLocaleString()}</span>
                       <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic ${fee.status === 'Paid' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>
                          {fee.status}
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Support Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-500/5 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-16">
              <div className="space-y-2">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Control <span className="text-indigo-600">Protocol</span></h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Maintenance & Institutional Support Stream</p>
              </div>
              <Link href="/student/complaints" className="h-12 px-8 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-indigo-600/20 hover:bg-slate-900 hover:scale-105 transition-all">
                Initiate Ticket
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {complaints.length === 0 ? (
                <div className="col-span-full py-24 text-center opacity-20 flex flex-col items-center grayscale">
                   <MessageSquare size={64} className="mb-6 animate-bounce" />
                   <p className="text-sm font-black uppercase italic tracking-widest">No Active Incidents Detected</p>
                </div>
              ) : (
                complaints.slice(0, 4).map(c => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={c.id} 
                    className="p-8 rounded-[2rem] bg-slate-50/50 border border-slate-100 hover:border-indigo-200 transition-all space-y-6 group"
                  >
                    <div className="flex items-start justify-between">
                       <div className="space-y-1">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block italic">{c.category}</span>
                         <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter line-clamp-1 group-hover:text-indigo-600 transition-colors">{c.subject}</p>
                       </div>
                       <div className={`w-3 h-3 rounded-full shadow-inner ${c.status === 'Resolved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200/50">
                       <span className={`text-[10px] font-black uppercase italic tracking-widest ${c.status === 'Resolved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                         {c.status}
                       </span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                         {new Date(c.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Cards */}
        <div className="lg:col-span-4 space-y-12">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white p-12 rounded-[3.5rem] flex flex-col items-center shadow-2xl shadow-indigo-500/5 border border-slate-200 relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 blur-[80px] rounded-full" />
             
             <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-10 border border-indigo-100 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                <MapPin size={36} />
             </div>
 
             <div className="w-full space-y-10 text-center relative z-10">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] inline-block px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">Primary Node</p>
                   <p className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">{room ? `Alpha ${room.roomNumber}` : 'Establishing'}</p>
                </div>
                
                <div className="pt-10 border-t border-slate-100 flex flex-col gap-6">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Network Rent</span>
                      <span className="text-2xl font-black text-slate-900 italic uppercase">${profile?.rentAmount || room?.price || 0}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Contract Integrity</span>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-emerald-600 italic uppercase">Active Protocol</span>
                         <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                   </div>
                </div>
 
                <Link href="/student/profile" className="h-16 w-full rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all active:scale-95 group">
                   Resident Identity <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </Link>
             </div>
          </motion.div>
 
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/10 blur-[80px] rounded-full" />
            <Heart size={48} className="text-emerald-500 mb-10 animate-pulse" />
            <h4 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">Premium <span className="text-indigo-400">Residency</span></h4>
            <p className="text-slate-400 text-base leading-relaxed mb-12 italic">
              Access the high-tier institutional perks and manage your stay with zero friction within the network.
            </p>
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-3xl shadow-inner">
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Service Integrity</span>
               <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
               </div>
            </div>
          </motion.div>
 
          <div className="px-10 py-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center gap-6 group hover:bg-white transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/5">
             <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xl group-hover:scale-110 duration-500">
                <ShieldCheck size={28} />
             </div>
             <p className="text-[10px] font-black text-indigo-900 leading-relaxed uppercase tracking-widest italic">
               Secured by <br/> <span className="text-indigo-600 text-lg tracking-tighter">Institutional Hub</span>
             </p>
          </div>
 
        </div>
      </div>
    </div>
  );
}
