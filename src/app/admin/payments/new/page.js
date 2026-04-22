"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, DollarSign, CreditCard, Calendar, UserCheck, ShieldCheck } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import StudentPicker from "@/components/StudentPicker";

export default function AddPaymentPage() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("Paid");
  const [method, setMethod] = useState("Online");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (selectedStudent?.rent_amount) {
      setAmount(selectedStudent.rent_amount.toString());
    }
  }, [selectedStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      addToast("Please select a student entity.", "warning");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/payments", {
        studentId: selectedStudent.id,
        amount: parseFloat(amount),
        paymentDate: date,
        status,
        paymentMethod: method,
        studentName: selectedStudent.name
      });
      
      addToast("Financial record committed successfully.", "success");
      router.push("/admin/fees");
    } catch (error) {
      console.error("Error adding payment:", error);
      addToast("Transmission failure. Record not saved.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <div className="mb-10">
        <Link 
          href="/admin/fees" 
          className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Treasury
        </Link>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200/50 shadow-2xl shadow-slate-100 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
         
         <div className="bg-slate-900 p-12 text-white flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-900/40 border-4 border-slate-900">
               <CreditCard size={32} />
            </div>
            <div>
               <h1 className="text-3xl font-black italic tracking-tight uppercase">Manual Remittance</h1>
               <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Financial Registry Authorization</p>
            </div>
         </div>

         <form onSubmit={handleSubmit} className="p-12 space-y-10 group/form">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="md:col-span-2">
                  <StudentPicker 
                    onSelect={(s) => setSelectedStudent(s)} 
                    selectedStudentId={selectedStudent?.id}
                  />
                  {selectedStudent && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                       <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-700 shadow-sm border border-blue-50">
                          <ShieldCheck size={18} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest leading-none mb-1">Entity Verified</p>
                          <p className="text-xs font-bold text-blue-700">{selectedStudent.name} (Room: {selectedStudent.room_number || 'TBD'})</p>
                       </div>
                    </div>
                  )}
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                     <DollarSign size={14} className="text-blue-500" /> Settled Amount
                  </label>
                  <div className="relative group">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">$</span>
                     <input
                       type="number"
                       required
                       min="0"
                       step="0.01"
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-200/50 rounded-2xl text-2xl font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner tracking-tighter"
                       placeholder="0.00"
                     />
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                     <Calendar size={14} className="text-blue-500" /> Effective Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200/50 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none uppercase tracking-widest cursor-pointer shadow-inner"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                     <UserCheck size={14} className="text-blue-500" /> Remittance Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200/50 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none uppercase tracking-widest cursor-pointer shadow-inner"
                  >
                    <option value="Paid">Processed (Full)</option>
                    <option value="Pending">Pending Approval</option>
                  </select>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                     <CreditCard size={14} className="text-blue-500" /> Transaction Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-200/50 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all appearance-none uppercase tracking-widest cursor-pointer shadow-inner"
                  >
                    <option value="Online">Online Transfer</option>
                    <option value="Cash">Cash Settlement</option>
                    <option value="UPI">UPI Protocol</option>
                    <option value="Cheque">Standard Cheque</option>
                  </select>
               </div>
            </div>

            <div className="pt-10 flex items-center justify-between border-t border-slate-50">
               <div className="hidden sm:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                     <ShieldCheck size={20} />
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest max-w-[140px]">SECURE TRANSACTIONAL RECONCILIATION</p>
               </div>
               
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full sm:w-auto px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all active:scale-95 shadow-2xl shadow-slate-200 disabled:opacity-50"
               >
                 {loading ? <Loader2 size={18} className="animate-spin" /> : "Authorize Settlement"}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
