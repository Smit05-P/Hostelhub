"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { 
  Building2, 
  MapPin, 
  User, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Sparkles,
  Zap,
  LayoutDashboard
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function JoinHostelPage() {
  const { code } = useParams();
  const router = useRouter();
  const { user, userData, loading: authLoading, refreshStudentHostel } = useAuth();
  const { addToast } = useToast();

  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (code) {
      validateCode();
    }
  }, [code]);

  const validateCode = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/hostels/validate-code?code=${code}`);
      setHostel(res.data.hostel);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid join code");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      // Save code for after login
      sessionStorage.setItem("pendingJoinCode", code);
      addToast("Please login to join the hostel", "info");
      router.push("/login?redirect=/join/" + code);
      return;
    }

    setJoining(true);
    try {
      const res = await axios.post("/api/hostels/join", {
        method: "code",
        joinCode: code,
        userId: user.uid,
        userName: userData?.name || user.displayName,
        userEmail: userData?.email || user.email
      });

      const { status, hostelId, message } = res.data;
      addToast(message || "Successfully joined!", "success");

      if (status === "approved") {
        await refreshStudentHostel(hostelId);
        router.replace("/student/dashboard");
      } else {
        router.replace("/student/pending");
      }
    } catch (err) {
      addToast(err.response?.data?.error || "Failed to join hostel", "error");
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/10 border border-slate-100 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Building2 size={40} />
          </div>
          <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tight">Access Denied</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider leading-relaxed">
            {error}. The link might be expired or the hostel node is inactive.
          </p>
          <button 
            onClick={() => router.push("/")}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all active:scale-95 shadow-xl italic"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[3rem] p-1 shadow-2xl shadow-indigo-500/10 border border-white z-10"
      >
        <div className="bg-white rounded-[2.8rem] p-8 sm:p-12 space-y-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100/50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] italic mb-2">
              <Zap size={14} className="fill-blue-600" />
              Direct Invite
            </div>
            <h1 className="text-4xl sm:text-5xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
              HostelHub <span className="text-blue-600">Connect</span>
            </h1>
          </div>

          {/* Invitation Card */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-[2.5rem] p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
               <Building2 size={120} />
             </div>
             
             <div className="relative z-10 space-y-6">
               <div className="flex items-start gap-4">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/10 border border-slate-100 shrink-0">
                   <Building2 size={28} className="text-blue-600" />
                 </div>
                 <div className="space-y-1">
                   <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tight leading-tight">
                     {hostel?.hostelName}
                   </h2>
                   <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-widest italic">
                     <MapPin size={12} className="shrink-0" />
                     {hostel?.address || "Universal Location"}
                   </div>
                 </div>
               </div>

               <div className="h-px bg-slate-200/60 w-full" />

               <div className="flex items-center justify-between gap-6">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                     <User size={18} className="text-slate-400" />
                   </div>
                   <div className="space-y-0.5">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block italic leading-none">Node Admin</span>
                     <span className="text-sm font-bold text-slate-700 italic">{hostel?.ownerName}</span>
                   </div>
                 </div>
                 
                 <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 ${
                   hostel?.autoApprove 
                   ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                   : 'bg-amber-50 text-amber-600 border border-amber-100'
                 }`}>
                   <ShieldCheck size={14} />
                   {hostel?.autoApprove ? "Zero-Trust Bypass" : "Approval Required"}
                 </div>
               </div>
             </div>
          </div>

          {/* Action */}
          <div className="space-y-4">
             <button 
               onClick={handleJoin}
               disabled={joining}
               className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-blue-600/30 group disabled:opacity-50 italic"
             >
               {joining ? (
                 <Loader2 size={24} className="animate-spin" />
               ) : (
                 <>
                   Initialize Connection 
                   <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                 </>
               )}
             </button>
             
             <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] italic px-6 leading-relaxed">
               By joining, you agree to comply with the facility's registration protocols and privacy policies.
             </p>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="mt-12 flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
         <Sparkles size={16} className="text-blue-500" />
         <span className="text-xs font-black uppercase tracking-[0.5em] italic">HostelHub SaaS</span>
      </div>
    </div>
  );
}
