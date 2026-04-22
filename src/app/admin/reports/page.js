"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Search, Download, Printer, FileSpreadsheet,
  FileText, Users, DollarSign, CheckCircle2, UserCheck,
  ChevronUp, ChevronDown, ChevronsUpDown, X, RotateCcw,
  Filter, AlertCircle, ChevronLeft, ChevronRight,
  Target, Zap, ShieldCheck, Database, Maximize2
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const ITEM_VARIANTS = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 350, damping: 25 }
  }
};

import { useQuery } from "@tanstack/react-query";

const COLUMNS = [
  { key: "name",          label: "Identity",       sortable: true  },
  { key: "mobile",        label: "Contact Vector", sortable: true  },
  { key: "roomNumber",    label: "Node #",         sortable: true  },
  { key: "roomType",      label: "Tier",           sortable: true  },
  { key: "fieldOfStudy",  label: "Specialization", sortable: true  },
  { key: "collegeName",   label: "Origin Node",    sortable: true  },
  { key: "checkInDate",   label: "Temporal In",    sortable: true  },
  { key: "daysRemaining", label: "Days Left",      sortable: true  },
  { key: "monthlyFee",    label: "Yield Value",    sortable: true  },
  { key: "amountPaid",    label: "Collected",      sortable: true  },
  { key: "amountPending", label: "Dissonance",     sortable: true  },
  { key: "paymentStatus", label: "Ledger",         sortable: true  },
];

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <motion.div 
    variants={ITEM_VARIANTS}
    whileHover={{ y: -5, scale: 1.02 }}
    className="premium-glass p-10 rounded-[2.5rem] border border-slate-200/60 flex flex-col justify-between hover:shadow-2xl transition-all shadow-sm relative overflow-hidden h-full group bg-white shadow-xl"
  >
     <div className={`absolute -right-8 -top-8 w-32 h-32 ${color} opacity-5 rounded-full transition-transform group-hover:scale-125 duration-700`} />
     <div className={`w-14 h-14 rounded-[1.5rem] ${color} bg-opacity-10 flex items-center justify-center text-slate-900 border border-white/20 shadow-inner italic transition-transform group-hover:rotate-6`}>
        <Icon size={28} className={color.replace('bg-', 'text-')} />
     </div>
     <div className="mt-10">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic leading-none">{label}</p>
        <p className="text-4xl font-black text-slate-900 italic tracking-tighter mt-3">{value}</p>
     </div>
  </motion.div>
);

export default function ReportsPage() {
  const { addToast } = useToast();
  const printRef = useRef(null);

  const [search, setSearch]         = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [sortKey, setSortKey]       = useState("name");
  const [sortDir, setSortDir]       = useState("asc");

  const { data, isLoading } = useQuery({
    queryKey: ["reports-students"],
    queryFn: async () => {
      const res = await axios.get("/api/reports/students");
      return res.data;
    },
    onError: () => addToast("Matrix sync failure.", "error")
  });

  const allRows = data?.rows || [];
  const summary = data?.summary || { totalStudents: 0, totalCollected: 0, totalPending: 0, activeStudents: 0 };

  const sortedData = useMemo(() => {
    let rows = [...allRows];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q));
    }
    if (filterPayment) rows = rows.filter(r => r.paymentStatus === filterPayment);
    if (filterStatus)  rows = rows.filter(r => r.status === filterStatus);

    rows.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (va == null) va = ""; if (vb == null) vb = "";
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return rows;
  }, [allRows, search, filterPayment, filterStatus, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const headers = COLUMNS.map(c => c.label);
    const csvRows = sortedData.map(r => [
      r.name, r.mobile, r.roomNumber, r.roomType,
      r.fieldOfStudy, r.collegeName,
      r.checkInDate ? new Date(r.checkInDate).toLocaleDateString() : "",
      r.daysRemaining ?? "",
      r.monthlyFee, r.amountPaid, r.amountPending,
      r.paymentStatus
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    const dateStr = new Date().toISOString().split("T")[0];
    const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `HostelHub_Report_${dateStr}.csv`;
    a.click();
    addToast("Matrix exported to CSV.", "success");
  };

  const exportPDF = async () => {
    addToast("Generating PDF stream...", "info");
    try {
      const jsPDFModule     = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const jsPDF           = jsPDFModule.default;
      const autoTable       = autoTableModule.default;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      
      doc.setFontSize(22); doc.text("HostelHub Student Matrix", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [COLUMNS.map(c => c.label)],
        body: sortedData.map(r => [
          r.name, r.mobile, r.roomNumber, r.roomType,
          r.fieldOfStudy, r.collegeName,
          r.checkInDate ? new Date(r.checkInDate).toLocaleDateString() : "—",
          r.daysRemaining ?? "—",
          `$${r.monthlyFee}`, `$${r.amountPaid}`, `$${r.amountPending}`,
          r.paymentStatus
        ]),
      });
      doc.save("HostelHub_Matrix.pdf");
      addToast("PDF stream localized.", "success");
    } catch (err) {
      addToast("PDF generation failure.", "error");
    }
  };

  const handlePrint = () => window.print();

  if (isLoading && allRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-8">
        <div className="relative">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/10"
          >
            <FileSpreadsheet size={36} />
          </motion.div>
          <Zap className="absolute -top-3 -right-3 text-indigo-500 animate-pulse" size={24} />
        </div>
        <p className="font-black uppercase tracking-[0.5em] text-[12px] text-slate-400 italic">Compiling Institutional Intelligence...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={CONTAINER_VARIANTS}
      className="space-y-12 pb-24"
      id="report-print-area"
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-print-area, #report-print-area * { visibility: visible !important; }
          #report-print-area { position: absolute; left: 0; top: 0; width: 100%; height: auto !important; overflow: visible !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 no-print">
         <div className="flex-1">
            <div className="inline-flex items-center gap-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-100 italic mb-5 shadow-sm">
               DATA INTELLIGENCE CORE
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none flex items-center gap-5">
               <Target size={48} className="text-indigo-600" /> STUDENT MATRIX
            </h1>
            <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.3em] mt-5 italic leading-none opacity-80 text-highlight">Global institutional resident ledger — spatial & financial markers</p>
         </div>

         <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full xl:w-auto">
            <SummaryCard icon={Users} label="Residents" value={summary.totalStudents} color="bg-indigo-600" />
            <SummaryCard icon={DollarSign} label="Collected" value={`$${(summary.totalCollected / 1000).toFixed(1)}k`} color="bg-emerald-600" />
            <SummaryCard icon={AlertCircle} label="Dissonance" value={`$${(summary.totalPending / 1000).toFixed(1)}k`} color="bg-rose-600" />
            <SummaryCard icon={UserCheck} label="Active" value={summary.activeStudents} color="bg-slate-900" />
         </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-[2.5rem] border border-slate-200 shadow-xl no-print">
         <div className="relative group flex-1">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search Matrix Node ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-4 bg-transparent border-none focus:ring-0 text-[12px] font-black uppercase tracking-widest text-slate-700 placeholder:text-slate-300 italic"
            />
         </div>
         <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
         <select 
           value={filterPayment}
           onChange={(e) => setFilterPayment(e.target.value)}
           className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase tracking-widest text-slate-600 cursor-pointer appearance-none px-10 italic"
         >
           <option value="">EVERY LEDGER</option>
           <option value="Paid">PAID ONLY</option>
           <option value="Pending">PENDING ONLY</option>
         </select>
         <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />
         <div className="flex items-center gap-3 pr-2">
            <button onClick={exportCSV} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-inner border border-slate-100 italic group" title="CSV Export">
               <FileSpreadsheet size={18} className="transition-transform group-hover:scale-110" />
            </button>
            <button onClick={exportPDF} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-inner border border-slate-100 italic group" title="PDF Export">
               <FileText size={18} className="transition-transform group-hover:scale-110" />
            </button>
            <button onClick={handlePrint} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-inner border border-slate-100 italic group" title="Print Ledger">
               <Printer size={18} className="transition-transform group-hover:scale-110" />
            </button>
         </div>
      </div>

      {/* Matrix Table Section */}
      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden p-2">
         <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left min-w-[1800px]">
               <thead>
                  <tr className="bg-slate-50/50">
                     {COLUMNS.map((col) => (
                       <th 
                         key={col.key} 
                         onClick={() => col.sortable && handleSort(col.key)}
                         className={`px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] italic cursor-pointer transition-colors ${sortKey === col.key ? 'text-indigo-600' : 'text-slate-400'}`}
                       >
                          <div className="flex items-center gap-3">
                             {col.label}
                             {col.sortable && <ChevronsUpDown size={14} className="opacity-30" />}
                          </div>
                       </th>
                     ))}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {sortedData.length === 0 ? (
                      <tr>
                         <td colSpan={COLUMNS.length} className="py-48 text-center opacity-20">
                            <Database size={80} className="mx-auto mb-8 text-slate-400" />
                            <p className="font-black uppercase tracking-[0.5em] text-[14px] text-slate-400 italic">No Synchronization Markers Match Filters</p>
                         </td>
                      </tr>
                    ) : (
                      sortedData.map((row, i) => (
                        <motion.tr 
                          key={i} 
                          variants={ITEM_VARIANTS}
                          className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                        >
                           <td className="px-10 py-8">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white text-sm font-black shadow-xl italic group-hover:bg-indigo-600 transition-all">
                                    {row.name?.[0]}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-base font-black text-slate-900 uppercase tracking-tight italic group-hover:text-indigo-600 transition-colors">{row.name}</span>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mt-1.5">{row.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex flex-col">
                                 <span className="text-[12px] font-black text-slate-900 italic leading-none">{row.mobile || '—'}</span>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Mobile Terminal</p>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <span className="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black border border-slate-200 uppercase italic shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-700 group-hover:border-indigo-100 transition-all">NODE {row.roomNumber}</span>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[11px] font-black text-slate-500 uppercase italic leading-none">{row.roomType}</span>
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex flex-col">
                                 <span className="text-[11px] font-black text-slate-900 uppercase italic leading-tight">{row.fieldOfStudy || '—'}</span>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <div className="flex flex-col">
                                 <span className="text-[11px] font-black text-slate-900 uppercase italic leading-tight">{row.collegeName || '—'}</span>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[12px] font-black text-slate-600 italic tabular-nums uppercase leading-none">
                                 {row.checkInDate ? new Date(row.checkInDate).toLocaleDateString() : "—"}
                              </span>
                           </td>
                           <td className="px-10 py-8">
                              <span className={`text-[12px] font-black italic tabular-nums leading-none ${row.daysRemaining < 30 ? 'text-rose-500' : 'text-slate-900'}`}>{row.daysRemaining}</span>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[12px] font-black text-slate-900 tabular-nums italic leading-none font-mono">${row.monthlyFee?.toLocaleString()}</span>
                           </td>
                           <td className="px-10 py-8">
                              <span className="text-[12px] font-black text-emerald-600 tabular-nums italic leading-none font-mono">${row.amountPaid?.toLocaleString()}</span>
                           </td>
                           <td className="px-10 py-8">
                              <span className={`text-[12px] font-black tabular-nums italic leading-none font-mono ${row.amountPending > 0 ? 'text-rose-500' : 'text-slate-300'}`}>${row.amountPending?.toLocaleString()}</span>
                           </td>
                           <td className="px-10 py-8">
                              <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border italic shadow-sm leading-none ${
                                row.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                 {row.paymentStatus}
                              </span>
                           </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
               </tbody>
            </table>
         </div>
      </div>
    </motion.div>
  );
}
