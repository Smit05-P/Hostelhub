"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, AlertCircle, Info } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function IntelInsightCard({ hostelId, role, title = "Intel Insight" }) {
  const [state, setState] = useState("loading");
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchInsight() {
      if (!hostelId) {
        setState("empty");
        setInsight(null);
        return;
      }

      setState("loading");
      setInsight(null);
      setError("");

      try {
        const prompt = role === 'admin' 
          ? "Give a 1-sentence executive summary of the current hostel status based on stats." 
          : "Give a 1-sentence helpful tip for a student staying in a hostel today.";
          
        const { data } = await axios.post("/api/intel", {
          messages: [{ role: "user", content: prompt }],
          hostelId,
        }, { signal: controller.signal });

        if (!data?.success || typeof data.answer !== "string" || !data.answer.trim()) {
          throw new Error(data?.error?.message || "Intel returned an invalid response.");
        }

        setInsight(data);
        setState(data.dataStatus === "empty" ? "empty" : "success");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.response?.data?.error?.message || err.message || "Intel could not load an answer.");
        setState("error");
      }
    }

    fetchInsight();
    return () => controller.abort();
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

      {state === "loading" ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={12} className="animate-spin text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Consulting Core...</span>
        </div>
      ) : state === "error" ? (
        <div className="flex items-start gap-2 text-sm text-rose-700" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {state === "empty" && (
            <div className="flex items-start gap-2 text-xs text-slate-500" role="status">
              <Info size={15} className="mt-0.5 shrink-0" />
              <span>{hostelId ? "No operational records are available for this hostel yet." : "Select a hostel to view an Intel insight."}</span>
            </div>
          )}
          {insight && (
            <>
              {insight.summary && (
                <p className="text-sm font-semibold leading-relaxed text-slate-900">
                  {insight.summary}
                </p>
              )}
              {insight.answer && insight.answer !== insight.summary && (
                <div className="min-w-0 text-sm leading-6 text-slate-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="my-3 max-w-full overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full min-w-[360px] border-collapse text-left text-xs" {...props} />
                        </div>
                      ),
                      th: ({ node, ...props }) => (
                        <th className="border-b border-slate-200 bg-indigo-50 px-3 py-2 text-left font-semibold text-indigo-950" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="border-b border-slate-100 px-3 py-2 align-top text-slate-700" {...props} />
                      ),
                      h1: ({ node, ...props }) => <h1 className="mb-2 mt-4 text-base font-bold text-slate-900 first:mt-0" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="mb-2 mt-4 text-sm font-bold text-slate-900" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="mb-1 mt-3 text-sm font-semibold text-indigo-800" {...props} />,
                      p: ({ node, ...props }) => <p className="my-2 break-words leading-6 text-slate-700" {...props} />,
                      ul: ({ node, ...props }) => <ul className="my-2 list-disc space-y-1 pl-5 text-sm text-slate-700" {...props} />,
                      ol: ({ node, ...props }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-sm text-slate-700" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                    }}
                  >
                    {insight.answer}
                  </ReactMarkdown>
                </div>
              )}
              {insight.keyInsights?.length > 0 && (
                <ul className="list-disc space-y-1 pl-4 text-sm leading-6 text-slate-700">
                  {insight.keyInsights.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
                </ul>
              )}
              {insight.recommendations?.length > 0 && (
                <ul className="space-y-1 text-sm leading-6 text-indigo-800">
                  {insight.recommendations.map((item, index) => <li key={`${index}-${item}`}>• {item}</li>)}
                </ul>
              )}
            </>
          )}
          <div className="flex items-center justify-between pt-2">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
               {state === "empty" ? "No data" : "AI Analysis"}
             </span>
             {state === "success" ? (
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             ) : null}
          </div>
        </div>
      )}
    </motion.div>
  );
}
