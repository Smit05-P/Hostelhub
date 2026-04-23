"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Plus, Trash2, Search, Filter, Loader2, CreditCard, Receipt, Calendar, User } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

import { SkeletonHero, SkeletonCard, Shimmer } from "@/components/ui/Skeleton";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const { addToast } = useToast();

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/payments");
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
      addToast("Failed to load payment records from registry.", "error");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleDelete = async (id) => {
    if (!window.confirm("Confirm permanent removal of this financial record?")) return;

    try {
      await axios.delete(`/api/payments/${id}`);
      setPayments(payments.filter(p => p.id !== id));
      addToast("Record purged from ledger.", "success");
    } catch (error) {
      addToast("Failed to purge record.", "error");
    }
  };

  const filteredPayments = useMemo(() => {
    return (payments || []).filter((payment) => {
      // payment.studentId is populated, so it has a .name field
      const studentName = (payment.studentId?.name || payment.studentName || "Unknown").toLowerCase();
      const matchesSearch = studentName.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  if (loading && (payments || []).length === 0) {
    return (
      <div className="p-8 space-y-12 max-w-7xl mx-auto pb-32">
        <SkeletonHero />
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/50 flex justify-between items-center">
           <Shimmer className="w-1/3 h-12 rounded-2xl" />
           <Shimmer className="w-1/4 h-12 rounded-2xl" />
        </div>
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-10 space-y-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-8 pb-8 border-b border-slate-50 last:border-0 last:pb-0">
                   <div className="flex items-center gap-5 flex-1">
                      <Shimmer className="w-12 h-12 rounded-2xl" />
                      <div className="space-y-2">
                         <Shimmer className="w-48 h-5 rounded-lg" />
                         <Shimmer className="w-32 h-3 rounded-md" />
                      </div>
                   </div>
                   <Shimmer className="w-24 h-8 rounded-xl" />
                   <Shimmer className="w-32 h-6 rounded-lg" />
                   <Shimmer className="w-20 h-10 rounded-xl" />
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto min-h-screen bg-slate-50/10 transition-all duration-500">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
              <CreditCard className="text-blue-600" size={32} /> Remittance Ledger
           </h1>
           <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Validated transaction history and protocol status.</p>
        </div>
        <Link
          href="/admin/payments/new"
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95"
        >
          <Plus size={16} /> New Remittance
        </Link>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-200/50 shadow-sm">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Filter by student entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner"
          />
        </div>
        
        <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl shadow-inner border border-slate-100">
          {["All", "Paid", "Pending"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                statusFilter === s ? "bg-white text-blue-600 shadow-lg border border-slate-200" : "text-slate-300 hover:text-slate-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-sm overflow-hidden min-h-[500px] relative">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/50 grayscale-[50%]">
              <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                <th className="py-8 pl-10 text-left">Identity Profile</th>
                <th className="px-8 py-8 text-left">Settlement Value</th>
                <th className="px-8 py-8 text-left">Verification Date</th>
                <th className="px-8 py-8 text-center">Status</th>
                <th className="py-8 pr-10 text-right">Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-40 text-center space-y-4 opacity-20">
                    <Receipt size={64} className="mx-auto" />
                    <p className="text-xs font-black uppercase tracking-widest italic">Negative Registry Dispatch</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="py-8 pl-10">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-50 flex items-center justify-center font-black text-slate-300 text-lg group-hover:border-blue-100 group-hover:text-blue-500 transition-all duration-500">
                          {(payment.studentId?.name?.[0] || payment.studentName?.[0] || "?")}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight italic">{payment.studentId?.name || payment.studentName || 'Unidentified'}</p>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">Ref: {(payment._id || payment.id).slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                       <span className="text-xl font-black text-slate-900 tracking-tighter group-hover:text-blue-700 transition-colors">${parseFloat(payment.amount)?.toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-8 text-slate-500 font-bold text-xs uppercase tracking-widest">
                       <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-blue-400" />
                          {payment.date || (payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A')}
                       </div>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        payment.status === 'Paid' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-800 border-amber-100'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-8 pr-10 text-right">
                      <button 
                        onClick={() => handleDelete(payment._id || payment.id)} 
                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
