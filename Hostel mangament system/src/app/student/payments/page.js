"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Loader2, Search, CreditCard, Calendar, CheckCircle, AlertTriangle, 
  Clock, ArrowRight, X, ShieldCheck, Smartphone, Building2, History, Receipt,
  Wallet, DollarSign, ArrowLeft, RefreshCw, AlertCircle, Download, Activity,
  ZapOff, FileText, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const generateReceipt = (payment, user, fee, hostelData) => {
  const doc = new jsPDF();
  const hostelName = hostelData?.name || "HostelHub Institutional";
  
  // Brand Header
  doc.setFillColor(15, 23, 42); // slate-900 for premium look
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(hostelName, 14, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Official Financial Log", 160, 25);
  
  // Content
  doc.setTextColor(30, 41, 59); // Slate 900
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION DIRECTIVE", 14, 60);
  
  const txnId = payment?.id || payment?.transactionId || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const date = new Date(payment?.timestamp || payment?.paidAt || Date.now()).toLocaleDateString();
  const amount = payment?.amount || fee?.amount || 0;
  
  // Billing Period Logic
  let periodStr = "N/A";
  if (payment?.billingPeriod?.start && payment?.billingPeriod?.end) {
     const start = new Date(payment.billingPeriod.start.seconds * 1000).toLocaleDateString();
     const end = new Date(payment.billingPeriod.end.seconds * 1000).toLocaleDateString();
     periodStr = `${start} - ${end}`;
  } else if (fee?.month) {
     periodStr = `${MONTHS[fee.month-1]} ${fee.year}`;
  }

  const method = payment?.method || payment?.paymentMethod || "Online (Hub)";

  autoTable(doc, {
    startY: 70,
    head: [['Attribute', 'Directive State']],
    body: [
      ['Control ID', txnId],
      ['Temporal Timestamp', date],
      ['Establishment Resident', user?.name || user?.displayName || "N/A"],
      ['Identity Vector', user?.email || "N/A"],
      ['Billed Period Connectivity', periodStr],
      ['Transmission Channel', method],
      ['Integrity State', 'Fully Synchronized / Paid'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 8, font: "helvetica" },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [250, 251, 253] } }
  });

  // Total
  const finalY = (doc).lastAutoTable.finalY + 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(`VALUE SECURED: $${amount.toLocaleString()}`, 14, finalY);

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Authenticated institutional document. Zero friction residency verified.", 14, 280);

  doc.save(`HUB_RECEIPT_${txnId}.pdf`);
};

const PaymentModal = ({ fee, user, hostelData, onClose, onPaymentSuccess }) => {
  const [method, setMethod] = useState(null);
  const [duration, setDuration] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);

  const handleProcess = async () => {
    if (!method) return;
    setProcessing(true);
    setStep(2);
    const tid = toast.loading("Establishing secure bank link...");
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const res = await axios.post("/api/pay", { 
        feeId: fee.id, 
        studentId: user.uid, 
        studentName: user.name || user.email, 
        amount: fee.amount, 
        method,
        durationMonths: duration
      });
      if (res.data.success) {
        toast.success("Identity verified. Payment synchronized.", { id: tid });
        generateReceipt({ 
          method, 
          amount: fee.amount * duration,
          transactionId: res.data.transactionId || res.data.reference
        }, user, fee, hostelData);
        onPaymentSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Transaction interrupt. Reconnect and retry.", { id: tid });
      setStep(1);
    } finally {
      setProcessing(false);
    }
  };

  if (!fee) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
        >
          {/* Header */}
          <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20 group">
                  <ShieldCheck size={28} className="group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="space-y-1">
                   <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Identity <span className="text-indigo-600">Checkout</span></h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure encrypted institutional node</p>
                </div>
             </div>
             <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200">
               <X size={24} />
             </button>
          </div>

          <div className="p-10 space-y-10">
            {step === 1 ? (
              <div className="space-y-10">
                <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-1000" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 inline-block px-3 py-1 bg-white/5 rounded-full">Total Commitment</p>
                    <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase">${(fee.amount * duration).toLocaleString()}</h3>
                  </div>
                  <div className="relative z-10 text-right md:text-right text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 italic">Institutional Cycle</p>
                    <p className="text-xl font-black text-indigo-400 uppercase italic tracking-tighter">{MONTHS[fee.month-1]} {fee.year}</p>
                  </div>
                </div>

                 <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Connectivity Duration</label>
                  <div className="grid grid-cols-4 gap-3 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100 shadow-inner">
                     {[
                       { label: '01 MO', value: 1 },
                       { label: '03 MO', value: 3 },
                       { label: '06 MO', value: 6 },
                       { label: '12 MO', value: 12 }
                     ].map(opt => (
                       <button
                          key={opt.value}
                          onClick={() => setDuration(opt.value)}
                          className={`h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                            duration === opt.value ? 'bg-white text-indigo-600 shadow-2xl ring-1 ring-slate-100 scale-105' : 'text-slate-400 hover:text-slate-600'
                          }`}
                       >
                          {opt.label}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">Payment Vector</label>
                  <div className="grid grid-cols-2 gap-6">
                    <button 
                      onClick={() => setMethod('UPI')}
                      className={`h-28 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 group ${
                        method === 'UPI' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600 shadow-2xl shadow-indigo-500/5' : 'border-slate-100 bg-white text-slate-300 hover:border-slate-200'
                      }`}
                    >
                      <Smartphone size={32} strokeWidth={method === 'UPI' ? 2 : 1.5} className="group-hover:scale-110 transition-transform duration-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Instant UPI</span>
                    </button>
                    <button 
                      onClick={() => setMethod('Card')}
                      className={`h-28 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 group ${
                        method === 'Card' ? 'border-indigo-600 bg-indigo-50/30 text-indigo-600 shadow-2xl shadow-indigo-500/5' : 'border-slate-100 bg-white text-slate-300 hover:border-slate-200'
                      }`}
                    >
                      <CreditCard size={32} strokeWidth={method === 'Card' ? 2 : 1.5} className="group-hover:scale-110 transition-transform duration-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Credit Matrix</span>
                    </button>
                  </div>
                </div>

                <button 
                  disabled={!method || processing} 
                  onClick={handleProcess}
                  className="w-full h-20 bg-slate-900 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] italic shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-4 group"
                >
                  {processing ? <Loader2 size={24} className="animate-spin" /> : <Activity size={24} className="group-hover:animate-pulse" />}
                  Verify & Transmit
                </button>
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center text-center gap-10">
                <div className="relative">
                  <div className="w-24 h-24 border-[6px] border-slate-100 rounded-full"></div>
                  <div className="w-24 h-24 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={32} className="text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Establishing Stream</h4>
                  <p className="text-base text-slate-500 font-medium max-w-[320px] mx-auto leading-relaxed italic">Synchronizing with fiscal gateway. Maintain connectivity integrity.</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function StudentPaymentsPage() {
  const { user, hostelStatus, activeHostelData, refreshUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedFee, setSelectedFee] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [paymentsRes, transRes] = await Promise.all([
        axios.get(`/api/fees?studentId=${user.uid}`),
        axios.get(`/api/payments?studentId=${user.uid}`).catch(() => ({ data: [] }))
      ]);
      setPayments(paymentsRes.data || []);
      setTransactions(transRes.data || []);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setTimeout(() => setLoading(false), 800); // Artificial delay for smoother vibe
    }
  }, [user]);

  useEffect(() => { 
    if (hostelStatus === "APPROVED") {
      fetchAll(); 
    } else {
      setLoading(false);
    }
  }, [fetchAll, hostelStatus]);

  const filteredPayments = useMemo(() => {
    return (payments || []).filter((payment) => {
      const monthStr = MONTHS[(payment.month || 1) - 1]?.toLowerCase() || "";
      const matchesSearch = (payment.amount?.toString() || "").includes(searchQuery) || monthStr.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  if (hostelStatus !== "APPROVED") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="max-w-xl w-full text-center space-y-12"
         >
            <div className="w-32 h-32 bg-rose-50 text-rose-500 rounded-[3rem] border border-rose-100 flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/10 transition-transform duration-700 hover:rotate-6">
               <ZapOff size={56} strokeWidth={1.5} />
            </div>
            <div className="space-y-6">
               <h2 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter">Access <span className="text-rose-500">Void</span></h2>
               <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-sm mx-auto italic">
                 Identity verification required to establish billing connectivity. Authorized node access only.
               </p>
            </div>
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
               <button 
                onClick={() => refreshUser()}
                className="h-16 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 active:scale-95 group"
               >
                 <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                 Synchronize Status
               </button>
            </div>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-[1600px] mx-auto p-4 sm:p-12 space-y-16 animate-in fade-in duration-1000">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
            <Activity size={12} className="text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 italic">Financial Hub v4.0</span>
          </div>
          <h1 className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Fiscal <span className="text-indigo-600">Ledger</span></h1>
          <p className="text-xl text-slate-400 font-medium italic opacity-80">Autonomous billing stream management</p>
        </div>
        
        <div className="flex flex-wrap gap-6">
          <motion.div whileHover={{ y: -5 }} className="bg-white px-10 py-6 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-500/5 flex items-center gap-8 group">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">Pending</p>
              <p className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">{payments.filter(p => p.status !== 'Paid').length}</p>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5 }} className="bg-white px-10 py-6 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-500/5 flex items-center gap-8 group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">Synchronized</p>
              <p className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">{payments.filter(p => p.status === 'Paid').length}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-500/5 overflow-hidden flex flex-col min-h-[700px]"
      >
         {/* Controls Bar */}
         <div className="p-12 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-12 bg-slate-50/20">
            <div className="relative w-full lg:max-w-xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-all duration-500" />
              <input 
                type="text" 
                placeholder="Search billing cycle / stream value…" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 h-16 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-black uppercase tracking-widest focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-200 italic" 
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex bg-slate-100/50 p-2 rounded-[1.5rem] border border-slate-200/50">
                {['All', 'Pending', 'Paid'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                      statusFilter === s 
                        ? 'bg-slate-900 text-white shadow-2xl translate-y-[-2px]' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {s === 'All' ? 'Global' : s}
                  </button>
                ))}
              </div>
              <button 
                onClick={fetchAll}
                className={`w-14 h-14 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-xl shadow-indigo-500/5 transition-all ${loading ? 'animate-spin' : 'hover:rotate-180'}`}
              >
                <RefreshCw size={20} />
              </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
            {/* Active Billing Table */}
            <div className="lg:col-span-8 border-r border-slate-100 h-full flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 italic">
                      <th className="py-8 pl-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Billing Period</th>
                      <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Flow Value</th>
                      <th className="py-8 pr-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Directives</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-10 pl-12">
                             <div className="flex items-center gap-6">
                               <div className="w-16 h-16 bg-slate-50 rounded-2xl" />
                               <div className="space-y-2">
                                 <div className="h-5 bg-slate-50 rounded w-40" />
                                 <div className="h-3 bg-slate-50 rounded w-24" />
                               </div>
                             </div>
                          </td>
                          <td className="px-6 py-10"><div className="h-10 bg-slate-50 rounded-xl w-32" /></td>
                          <td className="py-10 pr-12 text-right"><div className="h-14 bg-slate-50 rounded-2xl w-40 ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredPayments.length === 0 ? (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan={3} className="py-48 text-center text-slate-300">
                          <div className="flex flex-col items-center gap-8 opacity-30 grayscale">
                             <ZapOff size={80} className="animate-pulse" />
                             <div className="space-y-2">
                               <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Null Flow</p>
                               <p className="text-[10px] font-black uppercase tracking-widest max-w-sm mx-auto leading-relaxed">System scan reveals no active or pending billing streams.</p>
                             </div>
                          </div>
                        </td>
                      </motion.tr>
                    ) : (
                      filteredPayments.map((p, idx) => (
                        <motion.tr 
                          key={p.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group hover:bg-slate-50/50 transition-all duration-500"
                        >
                          <td className="py-10 pl-12 border-l-4 border-transparent group-hover:border-indigo-600 transition-all duration-500">
                            <div className="flex items-center gap-8">
                               <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl italic shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700">
                                 {MONTHS[(p.month || 1) - 1][0]}
                               </div>
                               <div>
                                  <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors">{MONTHS[(p.month || 1) - 1]} {p.year}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Institutional Cycle Hub</p>
                               </div>
                            </div>
                          </td>
                          <td className="px-6">
                             <div className="space-y-2">
                               <p className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase transition-all duration-500 group-hover:scale-105 origin-left">${p.amount?.toLocaleString()}</p>
                               <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic ${
                                 p.status === 'Paid' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-xl shadow-rose-500/20'
                               }`}>
                                 {p.status}
                               </span>
                             </div>
                          </td>
                          <td className="py-10 pr-12 text-right">
                             {p.status !== 'Paid' ? (
                               <button 
                                onClick={() => setSelectedFee(p)}
                                className="h-16 px-10 rounded-[1.5rem] bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] italic shadow-2xl shadow-indigo-500/20 hover:scale-[1.05] hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-4 ml-auto group"
                               >
                                 Execute Stream <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-500" />
                               </button>
                             ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
                                   <div className="h-12 px-6 bg-emerald-50 text-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-100 flex items-center gap-3 shadow-inner italic">
                                     <CheckCircle2 size={16} /> Verified Link
                                   </div>
                                   <button 
                                     onClick={() => generateReceipt(p, user, null, activeHostelData)}
                                     className="h-12 px-8 bg-white text-indigo-600 border border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/5 hover:bg-indigo-600 hover:text-white transition-all duration-500 flex items-center gap-3 italic"
                                   >
                                     <Download size={16} /> Directive PDF
                                   </button>
                                </div>
                             )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar: History */}
            <div className="lg:col-span-4 bg-slate-50/10 p-12 space-y-12 h-full">
               <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Historical Feed</h3>
                  <History size={18} className="text-slate-300" />
               </div>

               <div className="space-y-6">
                  <AnimatePresence>
                  {transactions.length === 0 ? (
                    <div className="py-24 text-center gap-6 flex flex-col items-center opacity-10 grayscale">
                       <FileText size={64} className="text-slate-400 animate-pulse" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">NULL HISTORY STREAM</p>
                    </div>
                  ) : transactions.slice(0, 6).map((txn, itx) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + (itx * 0.1) }}
                      key={txn.id} 
                      className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-500/5 flex items-center justify-between group hover:border-indigo-400 transition-all duration-500"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-700">
                             <CheckCircle2 size={18} />
                          </div>
                          <div>
                             <p className="text-xl font-black text-slate-900 italic tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">${txn.amount.toLocaleString()}</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{new Date(txn.timestamp).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-[9px] font-black text-slate-200 uppercase tracking-[0.2em] italic transition-all group-hover:text-slate-400">{txn.method}</span>
                          <button onClick={() => generateReceipt(txn, user, null, activeHostelData)} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition-all duration-500 shadow-none hover:shadow-2xl">
                             <Download size={18} />
                          </button>
                       </div>
                    </motion.div>
                  ))}
                  </AnimatePresence>
               </div>

               <div className="p-10 bg-slate-900 rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-indigo-900/40 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                       <AlertCircle size={20} className="text-indigo-300 animate-pulse" />
                    </div>
                    <h4 className="font-black text-[10px] uppercase tracking-[0.3em] italic">Network Support</h4>
                  </div>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed relative z-10 italic">
                    Fiscal discrepancy detected in the stream? Contact the institutional node administrator with your transaction ID for atomic reconciliation.
                  </p>
                  <button className="h-14 w-full bg-white text-slate-900 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transform transition-transform group-hover:scale-[1.05]">
                    Open Secure Comms
                  </button>
               </div>
            </div>

         </div>
      </motion.div>
 
      {/* Modal Integration */}
      {selectedFee && (
        <PaymentModal 
          fee={selectedFee} 
          user={user} 
          hostelData={activeHostelData}
          onClose={() => setSelectedFee(null)} 
          onPaymentSuccess={fetchAll} 
        />
      )}
    </div>
  );
}
