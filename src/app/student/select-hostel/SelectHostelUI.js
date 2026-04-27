"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  Building2, 
  MapPin, 
  Loader2, 
  ArrowRight,
  ArrowLeft,
  Search, 
  LogOut, 
  CheckCircle2,
  Lock,
  KeyRound,
  Send,
  Navigation,
  Sparkles,
  Info
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SelectHostelUI() {
  const router = useRouter();
  const { user, role, activeHostelId, refreshStudentHostel, refreshUser, logout, loading: authLoading, userData } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState("selection"); // "selection" | "duration"
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [duration, setDuration] = useState("1Y");

  // Tab State
  const [activeTab, setActiveTab] = useState("code"); // 'code' | 'search'
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Form states
  const [joinCode, setJoinCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);
  const [requestingHostelId, setRequestingHostelId] = useState(null);
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);

  const durationOptions = [
    { label: "6 Months", value: "6M" },
    { label: "1 Year", value: "1Y" },
    { label: "2 Years", value: "2Y" },
    { label: "3 Years", value: "3Y" },
    { label: "4 Years", value: "4Y" },
    { label: "5 Years", value: "5Y" },
    { label: "6 Years", value: "6Y" },
  ];

  // Force-sync status on mount to trigger self-healing if admin approved in background
  useEffect(() => {
    const sync = async () => {
      const updatedUser = await refreshUser();
      const status = updatedUser?.hostelStatus?.toUpperCase()?.replace(/\s/g, '_');
      if (status === 'APPROVED') {
        router.replace("/student/dashboard");
      } else if (status === 'PENDING') {
        router.replace("/student/pending");
      }
    };
    sync();
  }, []);

  // Auto-search debounce
  useEffect(() => {
    if (activeTab !== "search") return;
    const timeout = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        try {
          const res = await axios.get(`/api/hostels/search?query=${encodeURIComponent(searchQuery)}`);
          setSearchResults(res.data?.hostels || []);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, activeTab]);

  // Check for pending invite code (from URL or session)
  useEffect(() => {
    const pendingCode = sessionStorage.getItem("pendingJoinCode");
    if (pendingCode && (user?._id || user?.id || user?.uid)) {
      sessionStorage.removeItem("pendingJoinCode");
      const code = pendingCode.trim().toUpperCase();
      setJoinCode(code);
      // Validate the code before advancing — never auto-advance without server confirmation
      setTimeout(async () => {
        try {
          const res = await axios.get(`/api/hostels/validate-code?code=${code}`);
          if (res.data.success && res.data.hostel) {
            setSelectedHostel({ method: "code", code, name: res.data.hostel.name, id: res.data.hostel.id });
            setStep("duration");
          } else {
            addToast("The invite code from your link is invalid.", "error");
          }
        } catch {
          addToast("Could not validate the invite code. Please enter it manually.", "error");
        }
      }, 400);
    }
  }, [user]);

  const handleFinalSubmission = async () => {
    if (!selectedHostel) return;
    
    setJoiningCode(true);
    setRequestingHostelId(selectedHostel.id || "processing");
    
    try {
      const payload = {
        studentId: (user?._id || user?.id || user?.uid),
        userName: userData?.name || user.displayName,
        userEmail: userData?.email || user.email,
        joiningDate,
        duration,
      };

      if (selectedHostel.method === "code") {
        payload.method = "code";
        payload.joinCode = selectedHostel.code;
      } else {
        payload.method = "request";
        payload.hostelId = selectedHostel.id;
        payload.hostelName = selectedHostel.name;
      }

      const res = await axios.post("/api/hostels/join", payload);
      const { status, hostelId, message } = res.data;
      
      if (res.status === 200 || res.status === 201) {
        addToast(message || "Successfully processed!", "success");
        await refreshUser();
        if (status === "Approved" && hostelId) {
          await refreshStudentHostel(hostelId);
          router.replace("/student/dashboard");
        } else {
          router.replace("/student/pending");
        }
      } else {
        throw new Error(message || "Unexpected response from server");
      }
    } catch (error) {
      if (error.response?.status === 409) {
        // Silently intercept 409 (Already applied) to prevent console noise
        addToast(error.response?.data?.error || "You already have a pending or approved request.", "info");
        await refreshUser();
        router.replace("/student/pending");
      } else {
        console.error("Submission Error:", error);
        const errorMsg = error.response?.data?.error || error.message || "Failed to process request.";
        addToast(errorMsg, "error");
      }
    } finally {
      setJoiningCode(false);
      setRequestingHostelId(null);
    }
  };

  const handleJoinByCode = async (e) => {
    if (e) e.preventDefault();
    if (!joinCode) return;
    
    setJoiningCode(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const res = await axios.get(`/api/hostels/validate-code?code=${code}`);
      
      if (res.data.success && res.data.hostel) {
        setSelectedHostel({ method: "code", code, name: res.data.hostel.name, id: res.data.hostel.id });
        setStep("duration");
      }
    } catch (error) {
      console.error("Code validation error:", error);
      addToast(error.response?.data?.error || "Invalid join code.", "error");
    } finally {
      setJoiningCode(false);
    }
  };

  const handleSelectHostel = (hostelId, hostelName) => {
    setSelectedHostel({ method: "request", id: hostelId, name: hostelName });
    setStep("duration");
  };

  if (authLoading) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 text-slate-900 font-jakarta overflow-x-hidden flex flex-col">
      {/* NAVBAR */}
      <nav className="border-b border-slate-200 py-5 px-6 md:px-12 flex items-center justify-between relative z-50 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Building2 size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">HostelHub</span>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:flex items-center gap-4 pl-5 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-full">
            <div className="flex flex-col items-end">
               <span className="text-xs font-black text-slate-700 italic">Hi, {userData?.name || "Student"}</span>
               <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Resident Candidate</span>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full border border-white/20 flex items-center justify-center text-[11px] font-black shadow-lg text-white">
              {userData?.name?.substring(0, 1).toUpperCase() || "S"}
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-3 bg-slate-50 hover:bg-rose-600 text-slate-400 hover:text-white rounded-2xl border border-slate-200 transition-all group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-24 max-w-4xl mx-auto w-full">
        {/* HEADER */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-6 italic shadow-sm">
             <Sparkles size={12} className="shrink-0 animate-pulse" />
             {step === "selection" ? "Step 1: Facility Search" : "Step 2: Stay Commitment"}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-slate-900 mb-4 shadow-sm pb-2">
            {step === "selection" ? <>Join a <span className="text-indigo-600">Hostel</span></> : <>Select <span className="text-indigo-600">Duration</span></>}
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-sm italic max-w-lg mx-auto opacity-80 leading-relaxed">
            {step === "selection" 
              ? "Enter an invite code provided by your admin, or search to request access."
              : `Specify how long you plan to stay at ${selectedHostel?.name || selectedHostel?.code || "the facility"}.`
            }
          </p>
        </div>

        {/* INTERFACE TABS */}
        <div className="w-full bg-white rounded-[3rem] p-4 sm:p-8 shadow-2xl border border-slate-100 animate-slide-up relative z-10 overflow-hidden">
          
          {step === "selection" ? (
            <>
              <div className="flex bg-slate-50 rounded-[2rem] p-2 border border-slate-200 mb-8 max-w-xl mx-auto shadow-inner object-contain">
                <button
                  onClick={() => setActiveTab("code")}
                  className={`flex-1 py-4 px-6 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 italic ${
                    activeTab === "code" 
                      ? "bg-white text-indigo-600 shadow-md border border-slate-100 transform scale-[1.02]" 
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  <KeyRound size={16} /> Have a Code
                </button>
                <button
                  onClick={() => setActiveTab("search")}
                  className={`flex-1 py-4 px-6 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 italic ${
                    activeTab === "search" 
                      ? "bg-white text-indigo-600 shadow-md border border-slate-100 transform scale-[1.02]" 
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  <Search size={16} /> Request Access
                </button>
              </div>

              <div className="min-h-[300px] flex flex-col justify-center max-w-xl mx-auto">
                {activeTab === "code" ? (
                  <form onSubmit={handleJoinByCode} className="space-y-6 animate-fade-in w-full">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-emerald-100 rotate-12 shadow-inner">
                        <Lock size={28} />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight italic text-slate-800">Secure Node Login</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider italic mt-2">Format: HST-XXXX</p>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <KeyRound size={20} className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input 
                        type="text" 
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="ENTER JOIN CODE..."
                        className="w-full h-16 bg-slate-50 border border-slate-200 rounded-[1.5rem] pl-16 pr-8 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-inner tracking-widest uppercase"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={!joinCode || joiningCode}
                      className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50 italic group"
                    >
                      {joiningCode ? (
                        <><Loader2 size={20} className="animate-spin" /> Validating Code...</>
                      ) : (
                        <>Proceed to Duration <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" /></>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6 animate-fade-in w-full h-full flex flex-col">
                     <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        placeholder="QUERY HOSTEL NAME..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-[2rem] tracking-[0.2em] font-black uppercase text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-300 text-sm shadow-inner italic"
                      />
                    </div>

                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[2rem] overflow-hidden p-2">
                      {searching ? (
                        <div className="h-48 flex flex-col items-center justify-center gap-4">
                          <Loader2 size={32} className="animate-spin text-indigo-500" />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Searching database...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                          {searchResults.map((h) => (
                            <div key={h._id} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group">
                               <div className="flex flex-col truncate pr-4">
                               <span className="font-black italic uppercase text-slate-800 truncate tracking-tight">{h.hostelName || h.name || "Hostel"}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{h.address || "Location unavailable"}</span>
                               </div>
                               <button 
                                 onClick={() => handleSelectHostel(h._id, h.hostelName)}
                                 className="h-10 px-5 shrink-0 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center shadow-lg italic"
                               >
                                  Select
                               </button>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery.length >= 2 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-center px-4 opacity-50">
                           <MapPin size={32} className="text-slate-300 mb-3" />
                           <span className="text-sm font-black uppercase italic tracking-widest text-slate-500">No facilities found</span>
                        </div>
                      ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-center px-4 opacity-50">
                           <Search size={32} className="text-slate-300 mb-3" />
                           <span className="text-[10px] font-black uppercase italic tracking-[0.3em] text-slate-500 max-w-[200px] leading-relaxed">Enter 2+ characters to search for public infrastructure nodes</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-8 animate-fade-in w-full max-w-xl mx-auto">
              <div className="grid grid-cols-1 gap-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-4 italic">Specify Joining Date</label>
                <div className="relative group">
                  <Navigation className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    type="date" 
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-4 italic">Choose Stay Duration</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={`h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        duration === opt.value 
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20 scale-[1.05]" 
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-indigo-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button 
                  onClick={handleFinalSubmission}
                  disabled={joiningCode || requestingHostelId !== null}
                  className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50 italic group"
                >
                  {joiningCode ? <Loader2 className="animate-spin" size={24} /> : <>Confirm & Request Access <Send size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /></>}
                </button>
                <button 
                  onClick={() => setStep("selection")}
                  disabled={joiningCode}
                  className="w-full h-14 bg-white text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100 italic"
                >
                  <ArrowLeft size={16} /> Back to Search
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
