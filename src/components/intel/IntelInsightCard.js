"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

export default function IntelInsightCard({ hostelId, role, title = "Intel Insight" }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsight() {
      if (!hostelId) return;
      try {
        const prompt = role === 'admin' 
          ? "Give a 1-sentence executive summary of the current hostel status based on stats." 
          : "Give a 1-sentence helpful tip for a student staying in a hostel today.";
          
        const res = await axios.post("/api/intel", {
          messages: [{ role: "user", content: prompt }],
          hostelId,
          role
        });
        setInsight(res.data.content);
      } catch (err) {
        setInsight(role === 'admin' ? "System status is optimal. No critical alerts." : "Keep your room locked and stay safe!");
      } finally {
        setLoading(false);
      }
    }
    fetchInsight();
  }, [hostelId, role]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden group rounded-[2rem] p-6 intel-glass border border-indigo-600/10 shadow-lg"
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-600/5 blur-[30px] rounded-full group-hover:bg-indigo-600/10 transition-colors" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <Sparkles size={16} className="text-white fill-white" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{title}</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={12} className="animate-spin text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Consulting Core...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] font-semibold text-slate-800 leading-relaxed italic">
            &quot;{insight}&quot;
          </p>
          <div className="flex items-center justify-between pt-2">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time Analysis</span>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
