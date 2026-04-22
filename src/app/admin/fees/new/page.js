"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Loader2, DollarSign, Calendar, 
  ShieldCheck, User, Receipt, 
  Wallet, Info, AlertCircle, Sparkles, Zap, Fingerprint, 
  CheckCircle2, Building2, Layers, CreditCard, Hash,
  ArrowRight, Landmark, Briefcase, UserCircle2, ArrowLeftCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import StudentPicker from "@/components/StudentPicker";
import toast from "react-hot-toast";

export default function NewFeePage() {
  const { user, activeHostelId } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("Paid");
  const [method, setMethod] = useState("Online");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Sync amount when student is selected
  useEffect(() => {
    if (selectedStudent?.rentAmount) {
      setAmount(selectedStudent.rentAmount.toString());
    } else if (selectedStudent?.rent_amount) {
      setAmount(selectedStudent.rent_amount.toString());
    } else {
      setAmount("0");
    }
  }, [selectedStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error("Please select a student first.");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    const tid = toast.loading("Recording transaction...");
    try {
      await axios.post("/api/payments", {
        studentId: selectedStudent.id,
        amount: parseFloat(amount),
        paymentDate: date,
        status,
        paymentMethod: method,
        studentName: selectedStudent.name,
        adminId: (user?.id || user?.uid) || "system",
        hostelId: activeHostelId
      });
      
      toast.success("Transaction verified successfully.", { id: tid });
      router.push("/admin/fees");
    } catch (error) {
      toast.error(error.response?.data?.error || "Transaction failed.", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <Link href="/admin/fees" className="inline-flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2 hover:text-indigo-600 transition-colors">
            <ArrowLeftCircle size={16} /> Back to Ledger
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate Billing Entry</h1>
          <p className="text-slate-500 text-sm">Create a manual financial record for rent collection or secondary service fees.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Selection & Form */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Step 1: Select Student */}
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <UserCircle2 size={100} />
              </div>
              <div className="flex items-center gap-5 mb-10">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                    <User size={22} />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-900">Resident Selection</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identify the billable resident</p>
                 </div>
              </div>
              
              <StudentPicker 
                onSelect={(s) => setSelectedStudent(s)} 
                selectedStudentId={selectedStudent?.id}
              />
          </div>

          {/* Step 2: Payment Details */}
          <div className={`bg-white p-8 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group ${selectedStudent ? 'border-slate-200 shadow-sm opacity-100' : 'border-slate-100 opacity-50 grayscale pointer-events-none'}`}>
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                <Landmark size={100} />
              </div>
              <div className="flex items-center gap-5 mb-10">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                    <Receipt size={22} />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-slate-900">Transaction Details</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure amount and fulfillment parameters</p>
                 </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Fulfillment Amount ($)</label>
                     <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 transition-colors">
                          <Hash size={16} />
                        </div>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full pl-14 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm h-14"
                          placeholder="0.00"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Transaction Date</label>
                     <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 transition-colors">
                          <Calendar size={16} />
                        </div>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full pl-14 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm h-14"
                        />
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Fulfillment Mode</label>
                     <div className="relative group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 transition-colors">
                         <CreditCard size={16} />
                       </div>
                       <select
                         value={method}
                         onChange={(e) => setMethod(e.target.value)}
                         className="w-full pl-14 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none h-14"
                       >
                         <option value="Online">Online Transfer</option>
                         <option value="Cash">Direct Cash</option>
                         <option value="UPI">Digital Wallet / UPI</option>
                         <option value="Cheque">Bank Clearing</option>
                       </select>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Ledger Status</label>
                     <div className="relative group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 transition-colors">
                         <CheckCircle2 size={16} />
                       </div>
                       <select
                         value={status}
                         onChange={(e) => setStatus(e.target.value)}
                         className="w-full pl-14 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none h-14"
                       >
                         <option value="Paid">Verification Full (Paid)</option>
                         <option value="Pending">Awaiting Clearance</option>
                       </select>
                     </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-4 text-slate-400 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <ShieldCheck size={16} className="text-indigo-600" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Transactions are immutable records</p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !selectedStudent}
                    className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white rounded-[1.25rem] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Wallet size={18} />}
                    Authorize Entry
                  </button>
                </div>
              </form>
          </div>
        </div>

        {/* Sidebar: Summary Context */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className={`bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-700 ${selectedStudent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Profiling Summary</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div className="p-8 space-y-8">
              {selectedStudent && (
                <>
                  <div className="flex items-center gap-5 pb-8 border-b border-slate-100">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl font-bold border border-indigo-100 shadow-inner">
                      {selectedStudent.name?.[0]}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-slate-900 tracking-tight">{selectedStudent.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedStudent.enrollmentId || 'Ref-ID UNK'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="flex justify-between items-center group/item hover:bg-slate-50 p-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <Building2 size={16} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Unit</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 px-3 py-1 bg-slate-100 rounded-lg">Room {selectedStudent.room_number || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center group/item hover:bg-slate-50 p-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <Landmark size={16} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Rate</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">${parseFloat(selectedStudent.rent_amount || 0).toLocaleString()}</span>
                    </div>
                    
                    <div className="p-6 bg-indigo-50/50 rounded-[1.5rem] flex gap-4 mt-6 border border-indigo-100/50">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <Info size={18} />
                      </div>
                      <p className="text-[10px] font-bold text-indigo-700 leading-relaxed uppercase tracking-widest">
                        Resident history and financial standing will be updated upon authorization.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 flex flex-col gap-6 shadow-sm shadow-amber-100/50 group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100 group-hover:scale-110 transition-transform">
                <AlertCircle size={24} />
              </div>
              <h4 className="font-bold text-sm text-amber-900 tracking-tight">Financial Protocol</h4>
            </div>
            <p className="text-[11px] font-bold text-amber-700/80 leading-relaxed uppercase tracking-[0.1em]">
              Verification of physical or digital transaction evidence is mandatory prior to finalizing the system entry.
            </p>
            <div className="flex items-center gap-2 text-[9px] font-bold text-amber-600/60 uppercase tracking-widest bg-white/50 w-fit px-3 py-1.5 rounded-full border border-amber-200">
               <Fingerprint size={12} /> System Integrity Audit
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
