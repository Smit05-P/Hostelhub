"use client";

import { useAuth } from "@/contexts/AuthContext";
import { 
  Loader2, BedDouble, DollarSign, MessageSquare, 
  CheckCircle, AlertTriangle, Clock, Hash, Users,
  Calendar, Building2, ShieldCheck, ShieldAlert, ArrowRight, Info,
  Sparkles, Zap, Heart, Star, CreditCard, RefreshCw,
  LayoutDashboard, UserCircle, MapPin, ZapOff, Activity
} from "lucide-react";
import Link from "next/link";
import IntelInsightCard from "@/components/intel/IntelInsightCard";
import { motion, AnimatePresence } from "framer-motion";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const InfoCard = ({ icon: Icon, label, value, sub, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 25, delay: delay / 1000 }}
    className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 relative overflow-hidden group"
  >
    <div className={`absolute -top-12 -right-12 w-40 h-40 blur-[60px] opacity-10 rounded-full transition-transform duration-700 group-hover:scale-150 ${colorClass}`} />
    
    <div className="flex items-center gap-5 mb-8 relative z-10">
      <div className={`w-14 h-14 rounded-2xl ${colorClass.replace('bg-', 'text-').split(' ')[0]} bg-slate-50 border border-slate-100 flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-sm`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] italic block mb-1">METRIC NODE</span>
        <h4 className="font-black text-slate-400 text-[11px] uppercase tracking-widest italic">{label}</h4>
      </div>
    </div>
    
    <div className="relative z-10">
      <p className="text-4xl font-black text-slate-900 mb-2 italic tracking-tighter uppercase">{value}</p>
      {sub && (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
        </div>
      )}
    </div>
  </motion.div>
);


export default function StudentDashboardPage() {
  const { user, hostelStatus, refreshUser } = useAuth();
  const { data, isLoading, error } = useStudentDashboard();
  const profile = data?.profile || null;
  const room = data?.room || null;
  const fees = data?.fees || [];
  const complaints = data?.complaints || [];
  const currentFee = data?.currentFee || null;
  const notices = data?.notices || [];
  const isApproved = hostelStatus === "APPROVED";
  const loading = isApproved && isLoading && !data;
  const now = new Date();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-24 p-4 sm:p-6 lg:p-8 animate-pulse">
        <div className="h-48 sm:h-64 rounded-3xl bg-slate-100 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-slate-100 w-full" />
          ))}
        </div>
        <div className="h-28 rounded-3xl bg-slate-100 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="h-96 rounded-3xl bg-slate-100 w-full" />
            <div className="h-96 rounded-3xl bg-slate-100 w-full" />
          </div>
          <div className="lg:col-span-4 space-y-8">
            <div className="h-80 rounded-3xl bg-slate-100 w-full" />
            <div className="h-64 rounded-3xl bg-slate-100 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-6">
         <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-xl font-bold text-slate-900">Connection Error</p>
              <p className="text-sm font-medium text-slate-500">Unable to load dashboard data. Please try again.</p>
            </div>
            <button
              onClick={() => refreshUser()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Retry
            </button>
         </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-8"
          >
            <div className="relative inline-block">
               <div className="w-32 h-32 bg-white rounded-full shadow-xl border border-slate-100 flex items-center justify-center mx-auto text-indigo-600">
                  <UserCircle size={64} strokeWidth={1.5} />
               </div>
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="absolute bottom-0 right-0 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white"
               >
                  <Clock size={20} />
               </motion.div>
            </div>
            
            <div className="space-y-3">
               <h2 className="text-3xl font-bold text-slate-900">
                 Pending Approval
               </h2>
               <p className="text-slate-500 font-medium leading-relaxed">
                 Your account is currently under review by the hostel administration. You will gain full access once approved.
               </p>
            </div>

            <div className="flex flex-col gap-4 pt-4">
               <button 
                onClick={() => refreshUser()}
                className="w-full h-14 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
               >
                 <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                 Refresh Status
               </button>
               <Link href="/student/profile" className="w-full h-14 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                 Edit Profile
               </Link>
            </div>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[3.5rem] bg-slate-900 p-10 sm:p-20 text-white shadow-3xl border border-white/5"
      >
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-full bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none translate-y-1/4 -translate-x-1/4" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
               <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] italic text-emerald-400">Security Clearance: ACTIVE RESIDENT</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter uppercase leading-none">
                HELLO, <span className="text-indigo-400 not-italic">{profile?.name?.split(" ")[0] || "RESIDENT"}</span>
              </h1>
              <p className="text-xl sm:text-2xl text-slate-400 font-bold uppercase tracking-tight italic">
                {room ? `STATIONED AT SECTOR: ROOM ${room.roomNumber}` : 'SECTOR ASSIGNMENT: PENDING AUTHENTICATION'}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
               <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest italic text-slate-300">
                  <Activity size={14} className="text-indigo-400" /> System Online
               </div>
               <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest italic text-slate-300">
                  <ShieldCheck size={14} className="text-emerald-400" /> Verified Identity
               </div>
            </div>
          </div>

          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-6 shrink-0">
             <div className={`px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] italic flex items-center gap-4 transition-all shadow-2xl ${room ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                {room ? <Building2 size={22} strokeWidth={2.5} /> : <Loader2 size={22} className="animate-spin" />}
                {room ? "ROOM ALLOCATED" : "PENDING LOGS"}
             </div>
             {currentFee && (
                <div className={`px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] italic flex items-center gap-4 backdrop-blur-xl border transition-all ${currentFee.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' : 'bg-rose-500 text-white shadow-rose-500/20 border-rose-400'}`}>
                   <CreditCard size={22} strokeWidth={2.5} />
                   LEDGER: {currentFee.status}
                </div>
             )}
          </div>
        </div>
      </motion.section>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard icon={LayoutDashboard} label="My Room" value={room ? room.roomNumber : "Pending"} sub={room ? "Current Assignment" : "Waiting for admin..."} colorClass="bg-indigo-600" delay={100} />
        <InfoCard icon={Building2} label="Hostel Block" value={room ? "Block A" : "-"} sub="Main Campus" colorClass="bg-emerald-500" delay={200} />
        <InfoCard icon={Users} label="Room Capacity" value={room ? `${room.capacity} Person` : "-"} sub="Occupancy limit" colorClass="bg-blue-600" delay={300} />
        <InfoCard 
          icon={Calendar} 
          label="Days Remaining" 
          value={profile?.daysLeft !== null ? `${profile.daysLeft}` : "-"} 
          sub={profile?.termEndDate ? `Ends: ${profile.termEndDate}` : "Contract period"} 
          colorClass="bg-amber-500" 
          delay={400} 
        />
      </div>

      {/* Notices Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[1.8rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-200 -rotate-3 transition-transform hover:rotate-0 duration-500">
              <Zap size={24} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic leading-none">Global Broadcast</span>
              <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase mt-2">Notice Board</h3>
            </div>
          </div>
          <Link href="/student/notices" className="px-8 py-4 bg-slate-100 text-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3">
            ARCHIVE <ArrowRight size={16} />
          </Link>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {notices.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
              <Info className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No active broadcasts detected.</p>
            </div>
          ) : (
            notices.map((notice, idx) => (
              <motion.div
                key={notice._id || idx}
                whileHover={{ y: -10, scale: 1.02 }}
                className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative group transition-all duration-500 hover:shadow-2xl hover:bg-white hover:border-indigo-100"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest italic">
                    {new Date(notice.date || notice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {idx === 0 && (
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                  )}
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-4 line-clamp-1 italic tracking-tighter uppercase">{notice.title}</h4>
                <p className="text-xs font-bold text-slate-500 line-clamp-3 leading-relaxed mb-8 italic uppercase tracking-tight">
                  {notice.description}
                </p>
                <Link 
                  href="/student/notices" 
                  className="text-[10px] font-black text-indigo-600 flex items-center gap-3 uppercase tracking-widest italic group-hover:gap-5 transition-all"
                >
                  ACCESS FULL LOG <ArrowRight size={14} strokeWidth={3} />
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>


      {/* Quick Insights - Moved below notices or merged */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <IntelInsightCard hostelId={user?.hostelId || profile?.hostelId} role="student" title="AI Roommate Insights" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Fees Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.8rem] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-100 -rotate-3 transition-transform hover:rotate-0 duration-500">
                  <CreditCard size={24} strokeWidth={2.5} />
                </div>
                <div>
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic leading-none">Financial Ledger</span>
                   <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase mt-2">Recent Payments</h3>
                </div>
              </div>
              <Link href="/student/payments" className="px-8 py-4 bg-slate-100 text-slate-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-slate-900 hover:text-white transition-all">
                LEDGER ACCESS
              </Link>
            </div>
            
            <div className="space-y-6">
              {fees.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-slate-200 gap-6">
                  <DollarSign size={64} strokeWidth={1} />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No transaction records found.</p>
                </div>
              ) : (
                fees.slice(0, 4).map((fee, fidx) => (
                  <motion.div 
                    whileHover={{ x: 10, scale: 1.01 }}
                    key={fee._id || fee.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-2xl transition-all duration-500 gap-8 group"
                  >
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${fee.status?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-emerald-50' : 'bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-50'}`}>
                          {fee.status?.toLowerCase() === 'paid' ? <CheckCircle size={24} strokeWidth={2.5} /> : <AlertTriangle size={24} strokeWidth={2.5} />}
                       </div>
                       <div>
                          <p className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                            {MONTHS[(fee.month||1)-1]} {fee.year}
                          </p>

                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">HOSTEL RENT UNIT</p>
                       </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-10 w-full sm:w-auto border-t sm:border-t-0 pt-6 sm:pt-0 border-slate-100">
                       <span className="text-3xl font-black text-slate-900 italic tracking-tighter">${fee.amount?.toLocaleString()}</span>
                       <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic border ${fee.status?.toLowerCase() === 'paid' ? 'bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-100' : 'bg-rose-500 text-white border-rose-400 shadow-xl shadow-rose-100'}`}>
                          {fee.status}
                       </div>
                    </div>

                  </motion.div>
                ))
              )}
            </div>
          </motion.div>


          {/* Complaints Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.8rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-100 -rotate-3 transition-transform hover:rotate-0 duration-500">
                  <ShieldAlert size={24} strokeWidth={2.5} />
                </div>
                <div>
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic leading-none">Support Hub</span>
                   <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase mt-2">Active Tickets</h3>
                </div>
              </div>
              <Link href="/student/complaints" className="px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200">
                INITIATE REPORT
              </Link>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {complaints.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center gap-6">
                   <MessageSquare size={64} strokeWidth={1} className="text-slate-200" />
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">No active incident reports found.</p>
                </div>
              ) : (
                complaints.slice(0, 4).map((c, cidx) => (
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    key={c._id || c.id} 
                    className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-2xl transition-all duration-500 space-y-6 group"
                  >
                    <div className="flex items-start justify-between">
                       <div className="space-y-2 pr-4">
                         <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] italic block">{c.category} CLASSIFIER</span>
                         <p className="text-xl font-black text-slate-900 italic tracking-tighter uppercase line-clamp-1 leading-none">{c.subject}</p>
                       </div>
                       <div className={`w-3 h-3 rounded-full shrink-0 shadow-lg ${c.status === 'Resolved' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200 animate-pulse'}`} />
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200/40">
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${c.status === 'Resolved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                         STATUS: {c.status}
                       </span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                         {new Date(c.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white p-10 rounded-[3.5rem] flex flex-col items-center shadow-2xl border border-slate-200 relative overflow-hidden group/room"
          >
             <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-8 border border-indigo-100 shadow-inner group-hover/room:rotate-12 transition-transform duration-500">
                <MapPin size={36} strokeWidth={2.5} />
             </div>
  
             <div className="w-full space-y-10 text-center">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">Spatial Assignment</p>
                   <p className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase">{room ? `ROOM ${room.roomNumber}` : 'PENDING'}</p>
                </div>
                
                <div className="pt-10 border-t border-slate-100 flex flex-col gap-6">
                   <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Unit Rent</span>
                      <span className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">${profile?.rentAmount || room?.rent || 0}</span>
                   </div>
                   <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Node Status</span>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                         <CheckCircle size={14} strokeWidth={3} />
                         <span className="text-[10px] font-black uppercase tracking-widest italic">ACTIVE</span>
                      </div>
                   </div>
                </div>
  
                <Link href="/student/profile" className="w-full h-16 rounded-[2rem] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.4em] italic flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 active:scale-95 group/btn">
                   ACCESS IDENTITY <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                </Link>
             </div>
          </motion.div>

 
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-600/20"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[40px] rounded-full" />
            <Heart size={36} className="text-indigo-200 mb-6" />
            <h4 className="text-2xl font-bold mb-3">Hostel Services</h4>
            <p className="text-indigo-100/80 text-sm leading-relaxed mb-8">
              Explore available amenities, request laundry, and manage your daily meals directly from the hub.
            </p>
            <button className="w-full h-12 bg-white text-indigo-600 rounded-xl font-bold hover:bg-slate-50 transition-colors text-sm">
              Explore Services
            </button>
          </motion.div>
 
        </div>
      </div>
    </div>
  );
}



