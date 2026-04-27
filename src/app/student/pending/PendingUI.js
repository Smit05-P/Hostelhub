"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Clock, ArrowLeft, Building2, LogOut, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function PendingUI() {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isCancelling, setIsCancelling] = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const showPopupRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchRequest() {
      if (!(user?._id || user?.id || user?.uid) || showPopupRef.current) return;
      try {
        const { data } = await axios.get(`/api/hostels/join-requests?studentId=${(user?._id || user?.id || user?.uid)}`);
        const req = data.requests?.[0] || null;
        
        if (!isMounted) return;

        const normalizedStatus = (req?.status || "").toUpperCase();

        // Deterministic redirect after status transition.
        if (normalizedStatus === "APPROVED") {
          console.log(`[PENDING-UI] Request APPROVED from DB. Showing approval popup...`);
          showPopupRef.current = true;
          setShowApprovalPopup(true);
          // Refresh session in background (non-blocking)
          refreshUser().catch(() => {});
          return;
        }

        if (normalizedStatus === "REJECTED") {
          console.log(`[PENDING-UI] Request REJECTED. Redirecting to select-hostel...`);
          await refreshUser().catch(() => {});
          router.replace("/student/select-hostel");
          return;
        }

        setRequest(req);
      } catch (err) {
        console.error("Failed to fetch request", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRequest();
    
    // Auto-refresh mechanism to check status every 3 seconds for instant-feel redirection
    const intervalId = setInterval(fetchRequest, 3000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user, refreshUser, router]);

  const handleCancel = async () => {
    if (!(request?._id || request?.id)) {
      await refreshUser();
      return;
    }
    setIsCancelling(true);
    try {
      await axios.delete(`/api/hostels/join-requests/${(request?._id || request?.id)}`);
      console.log("[PENDING-UI] Request cancelled successfully");
    } catch (e) {
      console.error("[PENDING-UI] Failed to cancel request", e);
    } finally {
      await refreshUser();
      setIsCancelling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative SaaS gradient background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="absolute top-6 right-6 lg:top-12 lg:right-12 z-20">
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-xl bg-white rounded-[4rem] p-12 sm:p-20 border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] text-center relative z-10"
      >
        
        <div className="space-y-12">
          <div className="relative inline-block">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-28 h-28 bg-indigo-50 text-indigo-600 mx-auto rounded-[3rem] flex items-center justify-center shadow-inner border border-indigo-100 relative overflow-hidden"
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500/20" />
              <Clock size={44} />
            </motion.div>
            <div className="absolute -top-2 -right-2 bg-white p-2.5 rounded-2xl shadow-xl border border-slate-50">
               <Sparkles size={18} className="text-amber-500 animate-bounce" />
            </div>
          </div>

          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest italic">
               Encryption Verified
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[1.1] uppercase italic">
              Verification <br /> In Progress
            </h1>
            <p className="text-base font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
              Connectivity initialized. Synchronizing your profile with <span className="text-slate-900 font-black italic">{request?.hostelName || "the selected facility"}</span>&apos;s local database.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl translate-x-4 -translate-y-4" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Gate Status</span>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter italic block">Pending Approval</span>
                {request?.duration && (
                  <span className="text-[10px] font-bold text-slate-400 mt-2 block italic">Requested: {request.duration}</span>
                )}
             </div>
             <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 text-left relative overflow-hidden">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Arrival Date</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-tighter italic block">
                  {request?.joiningDate ? new Date(request.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Standard Loop"}
                </span>
             </div>
          </div>

          <div className="pt-6 flex flex-col gap-6">
            <button 
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full h-18 py-6 rounded-[2rem] bg-slate-950 text-white text-[11px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:-translate-y-1 flex items-center justify-center gap-4 group italic disabled:opacity-70 disabled:pointer-events-none"
            >
              {isCancelling ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Terminating Connection...
                </>
              ) : (
                <>
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  Choose Different Facility
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-1">
                {[1,2,3].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-500" 
                  />
                ))}
              </div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic">
                Awaiting Uplink
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showApprovalPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-8 md:p-12 max-w-lg w-full shadow-2xl text-center border border-slate-100"
            >
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                Your profile is approved. Please relogin now.
              </h2>
              <button
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="w-full mt-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-indigo-600/30"
              >
                Relogin Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
