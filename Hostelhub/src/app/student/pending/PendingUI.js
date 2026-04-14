"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, ArrowLeft, Building2, LogOut, Loader2, Sparkles } from "lucide-react";
import { getStudentJoinRequest } from "@/lib/firestore";

export default function PendingUI() {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchRequest() {
      if (!user?.uid) return;
      try {
        const req = await getStudentJoinRequest({ userId: user.uid });
        
        if (!isMounted) return;

        if (!req || req.status === "rejected") {
          await refreshUser();
          router.replace("/student/select-hostel");
          return;
        }
        
        if (req.status === "approved") {
          await refreshUser();
          router.replace("/student/dashboard");
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
    
    // Auto-refresh mechanism to check status every 10 seconds
    const intervalId = setInterval(fetchRequest, 10000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative SaaS gradient background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="absolute top-6 right-6 lg:top-12 lg:right-12 z-20">
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="w-full max-w-xl bg-white rounded-[3.5rem] p-12 sm:p-20 border border-slate-100 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.08)] text-center relative z-10 animate-slide-up">
        
        <div className="space-y-10">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 mx-auto rounded-[2.5rem] flex items-center justify-center shadow-inner border border-indigo-100 relative">
              <Clock size={40} className="animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-50">
               <Sparkles size={16} className="text-amber-500 animate-bounce" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-[9px] font-black uppercase tracking-widest">
               Review Pending
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
              Application <br /> Under Review
            </h1>
            <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
              We've received your request to join <span className="text-indigo-600 font-bold">{request?.hostelName || "your selected hostel"}</span>. Our administrative team is currently verifying your details.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter italic">Validating</span>
             </div>
             <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Queue</span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-tighter italic">Standard</span>
             </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button 
              onClick={async () => {
                if (!request?.id) {
                  router.replace("/student/select-hostel");
                  return;
                }
                const btn = document.getElementById('cancel-btn');
                if (btn) btn.innerHTML = '<span class="flex items-center gap-2"><svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Cancelling...</span>';
                try {
                  const axios = (await import('axios')).default;
                  await axios.delete(`/api/hostels/join-requests/${request.id}`);
                  await refreshUser();
                  router.replace("/student/select-hostel");
                } catch (e) {
                  console.error(e);
                  await refreshUser();
                  router.replace("/student/select-hostel");
                }
              }}
              id="cancel-btn"
              className="w-full h-14 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
            >
              <ArrowLeft size={16} /> Choose Different Facility
            </button>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Automated system check every 60 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
