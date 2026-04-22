"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Loader2, Search, CreditCard, Calendar, CheckCircle, AlertTriangle, 
  Clock, ArrowRight, X, ShieldCheck, Smartphone, Building2, History, Receipt,
  Wallet, DollarSign, ArrowLeft, RefreshCw, AlertCircle, Download, Activity,
  ZapOff, FileText, CheckCircle2, Globe, Banknote, RotateCcw, Inbox, Lock, Shield
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DURATION_MONTHS = { "6M": 6, "1Y": 12, "2Y": 24, "3Y": 36, "4Y": 48 };

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const ITEM_VARIANTS = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

const toPositiveNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const resolveMonthlyFeeAmount = ({ fee, user, hostelData }) => {
  const feeAmount = toPositiveNumber(fee?.amount);
  if (feeAmount > 0) return feeAmount;

  const directRentAmount = toPositiveNumber(user?.rentAmount);
  if (directRentAmount > 0) return directRentAmount;

  const durationKey = user?.duration;
  const durationTotalFee = toPositiveNumber(hostelData?.settings?.feeConfig?.[durationKey]);
  if (durationTotalFee > 0) {
    const months = DURATION_MONTHS[durationKey] || 12;
    return Math.round(durationTotalFee / months);
  }

  const baseRent = toPositiveNumber(hostelData?.settings?.baseRent);
  if (baseRent > 0) return baseRent;

  return 0;
};

const generateReceipt = (payment, user, fee, hostelData) => {
  const doc = new jsPDF();
  const hostelName = hostelData?.name || "HostelHub Institutional";
  
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(hostelName, 14, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Payment Receipt", 170, 25);
  
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS", 14, 60);
  
  const txnId = payment?._id || payment?.id || payment?.transactionId || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const date = new Date(payment?.timestamp || payment?.paidAt || Date.now()).toLocaleDateString();
  const amount = payment?.amount || fee?.amount || 0;
  
  const duration = payment?.duration || 1;
  let periodStr = "N/A";
  if (payment?.billingPeriod?.start && payment?.billingPeriod?.end) {
     const start = new Date(payment.billingPeriod.start.seconds * 1000).toLocaleDateString();
     const end = new Date(payment.billingPeriod.end.seconds * 1000).toLocaleDateString();
     periodStr = `${start} - ${end}`;
  } else if (fee?.isTotalStayFee) {
     const durationLabel = (fee.adminRemarks || "").match(/\((.*?)\)/)?.[1] || user?.duration || "Full Stay";
     periodStr = `Full Stay Duration (${durationLabel})`;
  } else if (fee?.month) {
     if (duration > 1) {
        const endMonthIndex = (fee.month + duration - 2) % 12;
        const yearOffset = Math.floor((fee.month + duration - 2) / 12);
        periodStr = `${MONTHS[fee.month-1]} ${fee.year} - ${MONTHS[endMonthIndex]} ${fee.year + yearOffset} (${duration} Months)`;
     } else {
        periodStr = `${MONTHS[fee.month-1]} ${fee.year}`;
     }
  }

  const method = payment?.method || payment?.paymentMethod || "Online Payment";

  autoTable(doc, {
    startY: 70,
    head: [['Description', 'Details']],
    body: [
      ['Transaction ID', txnId],
      ['Date', date],
      ['Student Name', user?.name || user?.displayName || "N/A"],
      ['Email Address', user?.email || "N/A"],
      ['Billing Period', periodStr],
      ['Payment Method', method],
      ['Status', 'Paid Successfully'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 8, font: "helvetica" },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [250, 251, 253] } }
  });

  const finalY = (doc).lastAutoTable.finalY + 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text(`TOTAL PAID: $${amount.toLocaleString()}`, 14, finalY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184);
  doc.text("This is a computer generated receipt and requires no signature.", 14, 280);

  doc.save(`Receipt_${txnId}.pdf`);
};

const PaymentModal = ({ fee, user, hostelData, onClose, onPaymentSuccess }) => {
  const [method, setMethod] = useState('CARD_CREDIT');
  const [duration, setDuration] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const configuredMonthlyAmount = useMemo(
    () => resolveMonthlyFeeAmount({ fee, user, hostelData }),
    [fee, user, hostelData]
  );
  const totalAmount = configuredMonthlyAmount * duration;

  const handleProcess = async () => {
    setProcessing(true);
    setStep(2);
    const tid = toast.loading("Processing payment securely...");
    try {
      const res = await axios.post("/api/pay", { 
        feeId: fee._id || fee.id, 
        studentId: (user?._id || user?.id || user?.uid), 
        studentName: user?.name || user?.email, 
        amount: totalAmount, 
        method,
        durationMonths: duration
      });
      if (res.data.success) {
        toast.success("Payment successful!", { id: tid });
        generateReceipt({ 
          method, 
          amount: totalAmount,
          transactionId: res.data.transactionId || res.data.reference,
          duration: duration
        }, user, fee, hostelData);
        onPaymentSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Payment failed. Please try again.", { id: tid });
      setStep(1);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-3xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-xl rounded-[4rem] border border-slate-200 shadow-3xl p-10 sm:p-14 relative overflow-hidden my-auto"
      >
         <button 
           onClick={onClose}
           className="absolute top-10 right-10 p-3 rounded-2xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
         >
            <X size={20} />
         </button>

         {step === 1 ? (
           <>
             <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl -rotate-3 transition-transform hover:rotate-0">
                   <Lock size={32} />
                </div>
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">PAYMENT GATEWAY</h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 italic">Secure encrypted transaction node...</p>
                </div>
             </div>

             <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-10 space-y-6">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Protocol Unit</span>
                   <span className="text-sm font-black text-slate-900 italic uppercase">
                     {MONTHS[(fee?.month||1)-1]} {fee?.year}
                   </span>
                </div>
                {!fee.isTotalStayFee && (
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Duration</span>
                     <div className="flex gap-2">
                        {[1, 3, 6].map(m => (
                          <button 
                            key={m} onClick={() => setDuration(m)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${duration === m ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-200'}`}
                          >
                            {m}M
                          </button>
                        ))}
                     </div>
                  </div>
                )}
                <div className="h-px bg-slate-200/50" />
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Fiscal Obligation</span>
                   <span className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">${totalAmount.toLocaleString()}</span>
                </div>
             </div>

             <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center italic">Select Transmission Channel</p>
                <div className="grid grid-cols-2 gap-4">
                   {['UPI_DEBIT', 'CARD_CREDIT'].map(ch => (
                      <div 
                        key={ch} onClick={() => setMethod(ch)}
                        className={`p-6 rounded-[1.8rem] border flex flex-col items-center gap-4 cursor-pointer transition-all group ${method === ch ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-200'}`}
                      >
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${method === ch ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                            {ch === 'UPI_DEBIT' ? <Smartphone size={20} /> : <CreditCard size={20} />}
                         </div>
                         <span className={`text-[9px] font-black uppercase tracking-widest italic ${method === ch ? 'text-emerald-600' : 'text-slate-400'}`}>{ch.replace('_', ' ')}</span>
                      </div>
                   ))}
                </div>
             </div>

             <button 
                onClick={handleProcess}
                disabled={processing || configuredMonthlyAmount <= 0}
                className="w-full mt-12 py-7 bg-emerald-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.4em] italic shadow-3xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-6"
             >
                {processing ? <Loader2 className="animate-spin" size={24} /> : <ShieldCheck size={24} strokeWidth={2.5} />}
                AUTHORIZE TRANSACTION
             </button>
           </>
         ) : (
           <div className="py-20 flex flex-col items-center text-center gap-8">
              <div className="relative">
                <div className="w-24 h-24 border-[6px] border-slate-100 rounded-full" />
                <div className="w-24 h-24 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <Activity size={32} className="text-indigo-600" />
                </div>
              </div>
              <div className="space-y-3">
                 <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Processing Signal</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Authenticating with institutional ledger...</p>
              </div>
           </div>
         )}

         <div className="mt-8 flex items-center justify-center gap-3 text-slate-300">
            <Shield size={14} />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">256-BIT SSL ENCRYPTED GATEWAY</span>
         </div>
      </motion.div>
    </div>
  );
};

const PaymentSummaryCard = ({ label, value, sub, icon: Icon, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 25, delay: delay / 1000 }}
    className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 relative overflow-hidden group flex-1"
  >
    <div className={`absolute -top-12 -right-12 w-40 h-40 blur-[60px] opacity-10 rounded-full transition-transform duration-700 group-hover:scale-150 ${colorClass}`} />
    
    <div className="flex items-center gap-5 mb-8 relative z-10">
      <div className={`w-14 h-14 rounded-2xl ${colorClass.replace('bg-', 'text-').split(' ')[0]} bg-slate-50 border border-slate-100 flex items-center justify-center transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-sm`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] italic block mb-1">FISCAL NODE</span>
        <h4 className="font-black text-slate-400 text-[11px] uppercase tracking-widest italic">{label}</h4>
      </div>
    </div>
    
    <div className="relative z-10">
      <p className="text-4xl font-black text-slate-900 mb-2 italic tracking-tighter uppercase">{value}</p>
      {sub && (
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${colorClass.includes('emerald') ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
        </div>
      )}
    </div>
  </motion.div>
);

export default function StudentPaymentsPage() {
  const { user, hostelStatus, activeHostelData, refreshUser } = useAuth();
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState(null);

  const totalPaid = useMemo(() => transactions.reduce((acc, t) => acc + (t.amount || 0), 0), [transactions]);
  const totalPending = useMemo(() => {
    return fees.filter(f => (f.status || "").toLowerCase() !== 'paid').reduce((acc, f) => {
      const amt = resolveMonthlyFeeAmount({ fee: f, user, hostelData: activeHostelData });
      return acc + amt;
    }, 0);
  }, [fees, user, activeHostelData]);

  const fetchData = useCallback(async () => {
    const studentId = user?._id || user?.id || user?.uid;
    const hId = activeHostelData?._id || activeHostelData?.id || user?.hostelId;
    if (!studentId || !hId) return;
    setLoading(true);
    try {
      const [fRes, tRes] = await Promise.all([
        axios.get(`/api/fees?studentId=${studentId}&hostelId=${hId}`),
        axios.get(`/api/payments?studentId=${studentId}&hostelId=${hId}`).catch(() => ({ data: [] }))
      ]);
      setFees(fRes.data || []);
      setTransactions(tRes.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [user, activeHostelData]);

  useEffect(() => { if (hostelStatus === "APPROVED") fetchData(); else setLoading(false); }, [fetchData, hostelStatus]);

  if (hostelStatus !== "APPROVED") return <div className="p-20 text-center italic font-black uppercase text-slate-400">Restricted Node Access: Pending Approval</div>;

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={CONTAINER_VARIANTS}
      className="p-4 sm:p-8 space-y-12 sm:space-y-16 max-w-7xl mx-auto pb-32"
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12 items-end">
        <motion.div variants={ITEM_VARIANTS} className="xl:col-span-7">
           <div className="flex items-center gap-4 mb-6">
             <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-3xl shadow-emerald-100 rotate-3 group-hover:rotate-0 transition-transform">
               <CreditCard size={32} strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em] italic leading-none block mb-2">Fiscal Hub</span>
                <h1 className="text-4xl sm:text-6xl font-black text-slate-900 italic tracking-tighter mt-2 uppercase leading-none text-balance">TRANSACTION <span className="text-emerald-600 not-italic">LEDGER</span></h1>
             </div>
           </div>
           <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.2em] italic max-w-xl leading-relaxed">
             Track and manage your institutional financial obligations. 
             Real-time synchronization with the central billing hub is active.
           </p>
        </motion.div>
        
        <motion.div variants={ITEM_VARIANTS} className="xl:col-span-5 flex flex-wrap sm:flex-nowrap gap-4">
           <button
             onClick={fetchData}
             className="p-6 bg-slate-100 text-slate-600 rounded-[2.2rem] hover:bg-slate-200 transition-all active:scale-95 shadow-sm border border-slate-200/50 shrink-0"
             title="Refresh Ledger"
           >
             <RotateCcw size={22} className={loading ? "animate-spin text-indigo-600" : ""} />
           </button>
           <div className="flex-1 min-w-[200px] bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-xl flex items-center justify-between group overflow-hidden">
              <div className="flex items-center gap-4 min-w-0">
                 <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner group-hover:rotate-12 transition-transform shrink-0">
                    <ShieldCheck size={20} strokeWidth={2.5} />
                 </div>
                 <div className="min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic truncate">Node Status</p>
                    <p className="text-[11px] font-black text-slate-900 uppercase italic truncate">OPERATIONAL</p>
                 </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)] shrink-0" />
           </div>
        </motion.div>
      </div>


      <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
        <PaymentSummaryCard 
          label="Total Settlements" value={`$${totalPaid.toLocaleString()}`} 
          sub="Confirmed Payments" icon={CheckCircle} colorClass="bg-emerald-500" delay={100} 
        />
        <PaymentSummaryCard 
          label="Outstanding Balance" value={`$${totalPending.toLocaleString()}`} 
          sub="Pending Verification" icon={AlertTriangle} colorClass="bg-rose-500" delay={200} 
        />
        <PaymentSummaryCard 
          label="Billing Cycle" value="MONTHLY" 
          sub="Standard Protocol" icon={Calendar} colorClass="bg-indigo-500" delay={300} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         <motion.div variants={ITEM_VARIANTS} className="xl:col-span-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden p-2 sm:p-4">
            
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto scrollbar-hide">
               <table className="w-full text-left min-w-[900px]">
                  <thead>
                     <tr className="bg-slate-50/50">
                        {["Fiscal Unit", "Amount", "Status", "Action"].map((h, i) => (
                          <th key={i} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">{h}</th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     <AnimatePresence mode="popLayout">
                        {fees.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="py-48 text-center">
                                 <div className="inline-flex w-32 h-32 rounded-[3.5rem] bg-slate-50 items-center justify-center text-slate-200 mb-10 border border-slate-100 italic">
                                    <Inbox size={64} strokeWidth={1} />
                                 </div>
                                 <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">No Transaction Logs Found</h3>
                                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 italic">Synchronized ledger shows zero historical financial data.</p>
                              </td>
                           </tr>
                        ) : (
                           fees.map(fee => {
                              const statusLower = (fee.status || "").toLowerCase();
                              const displayAmount = statusLower === 'paid' ? toPositiveNumber(fee.amount) : resolveMonthlyFeeAmount({ fee, user, hostelData: activeHostelData });
                              
                              return (
                                <motion.tr 
                                  key={fee._id} layout variants={ITEM_VARIANTS}
                                  className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                                >
                                   <td className="px-10 py-8">
                                      <div className="flex items-center gap-6">
                                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black italic border shrink-0 group-hover:rotate-6 transition-transform ${
                                           statusLower === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                                         }`}>
                                            {fee.month?.toString().padStart(2, '0')}
                                         </div>
                                         <div>
                                            <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-emerald-600 transition-colors leading-none">
                                              {MONTHS[(fee.month||1)-1]} {fee.year}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Hostel Rent Unit</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-10 py-8">
                                      <span className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">
                                         ${displayAmount.toLocaleString()}
                                      </span>
                                   </td>
                                   <td className="px-10 py-8">
                                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic border ${
                                        statusLower === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                      }`}>
                                         <div className={`w-1.5 h-1.5 rounded-full ${statusLower === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                         {fee.status}
                                      </div>
                                   </td>
                                   <td className="px-10 py-8">
                                      {statusLower === 'pending' ? (
                                         <button 
                                           onClick={() => setSelectedFee(fee)}
                                           className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
                                         >
                                           PAY NOW
                                         </button>
                                      ) : (
                                         <button 
                                           onClick={() => generateReceipt(fee, user, fee, activeHostelData)}
                                           className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                                         >
                                           <Download size={18} />
                                         </button>
                                      )}
                                   </td>
                                </motion.tr>
                              );
                           })
                        )}
                     </AnimatePresence>
                  </tbody>
               </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-4 space-y-4">
               <AnimatePresence mode="popLayout" initial={false}>
                  {fees.length === 0 ? (
                    <div className="py-24 text-center opacity-20">
                       <Inbox size={48} className="mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest italic">Ledger Empty</p>
                    </div>
                  ) : (
                    fees.map(fee => {
                       const statusLower = (fee.status || "").toLowerCase();
                       const displayAmount = statusLower === 'paid' ? toPositiveNumber(fee.amount) : resolveMonthlyFeeAmount({ fee, user, hostelData: activeHostelData });

                       return (
                         <motion.div 
                           key={fee._id}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-6"
                         >
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black italic border ${statusLower === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-100'}`}>
                                    {fee.month?.toString().padStart(2, '0')}
                                 </div>
                                 <div>
                                    <p className="text-base font-black text-slate-900 uppercase italic leading-none">{MONTHS[(fee.month||1)-1]} {fee.year}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 italic">HOSTEL RENT UNIT</p>
                                 </div>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest italic border ${statusLower === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
                                 {fee.status}
                              </span>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-slate-400 uppercase italic">OBLIGATION</span>
                                 <span className="text-xl font-black text-slate-900 italic tracking-tighter">${displayAmount.toLocaleString()}</span>
                              </div>
                              {statusLower === 'pending' ? (
                                 <button 
                                   onClick={() => setSelectedFee(fee)}
                                   className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic"
                                 >
                                   PAY NOW
                                 </button>
                              ) : (
                                 <button 
                                   onClick={() => generateReceipt(fee, user, fee, activeHostelData)}
                                   className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl"
                                 >
                                   <Download size={18} />
                                 </button>
                              )}
                           </div>
                         </motion.div>
                       );
                    })
                  )}
               </AnimatePresence>
            </div>
         </motion.div>

         {/* Transactions Sidebar */}
         <motion.div variants={ITEM_VARIANTS} className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                     <History size={22} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Activity Log</h3>
               </div>

               <div className="space-y-6">
                  {transactions.length === 0 ? (
                    <div className="py-10 text-center space-y-4">
                       <Inbox size={40} className="text-slate-200 mx-auto" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No recent logs.</p>
                    </div>
                  ) : (
                    transactions.slice(0, 5).map(txn => (
                      <div key={txn._id} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-indigo-100 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                               <CheckCircle size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-900 italic tracking-tighter uppercase leading-none">${txn.amount.toLocaleString()}</p>
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{new Date(txn.timestamp).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => generateReceipt(txn, user, null, activeHostelData)}
                           className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                         >
                            <Download size={14} />
                         </button>
                      </div>
                    ))
                  )}
               </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group/card">
               <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 blur-2xl rounded-full" />
               <div className="flex items-center gap-5 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400 border border-white/10 group-hover/card:rotate-12 transition-transform">
                     <AlertCircle size={24} />
                  </div>
                  <div>
                     <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic">Support Uplink</span>
                     <p className="text-sm font-black uppercase tracking-tighter italic">FINANCIAL HUB</p>
                  </div>
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic leading-relaxed mb-8">
                  Encrypted financial logs are managed by institutional security. Contact admin for manual audit.
               </p>
               <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-white/10 transition-all">
                  REPORT DISCREPANCY
               </button>
            </div>
         </motion.div>
      </div>

      <AnimatePresence>
        {selectedFee && (
          <PaymentModal 
            fee={selectedFee} 
            user={user} 
            hostelData={activeHostelData}
            onClose={() => setSelectedFee(null)} 
            onPaymentSuccess={fetchData} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
