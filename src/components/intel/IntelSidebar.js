"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Send, Sparkles, Loader2, Bot, User, 
  MessageSquare, Terminal, Zap, Info
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function IntelSidebar({ isOpen, onClose }) {
  const { activeHostelId, role } = useAuth();
  const [messages, setMessages] = useState([
    { 
      role: "model", 
      content: `Hello! I'm HostelHub Intel. I have real-time access to this hostel's data. How can I assist you ${role === 'admin' ? 'with management today' : 'with your stay'}?` 
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/intel", {
        messages: [...messages, userMsg],
        hostelId: activeHostelId,
        role: role
      });

      setMessages(prev => [...prev, { role: "model", content: res.data.content }]);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Connection to Intel Node failed.";
      toast.error(errorMsg);
      setMessages(prev => [...prev, { 
        role: "model", 
        content: `Error: ${errorMsg}. Please ensure your API key is configured and try again.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[70] w-full max-w-md intel-glass border-l border-white/10 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Sparkles size={20} className="text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">HostelHub Intel</h2>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Intelligence Node</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/30"
            >
              <div className="bg-blue-600/5 border border-blue-100 rounded-2xl p-4 flex gap-3 text-[11px] font-medium text-blue-800 leading-relaxed shadow-sm">
                <Info size={16} className="shrink-0 text-blue-600" />
                <span>Intel can access your real-time dashboard data to generate summaries, analyze trends, and answer operational questions instantly.</span>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
                    m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-indigo-600'
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    <div className="prose prose-sm max-w-none prose-slate">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <div style={{overflowX:'auto',margin:'8px 0'}}>
                              <table style={{borderCollapse:'collapse',width:'100%',fontSize:'12px'}} {...props} />
                            </div>
                          ),
                          th: ({node, ...props}) => (
                            <th style={{background:'#f1f5f9',border:'1px solid #e2e8f0',padding:'6px 10px',textAlign:'left',fontWeight:700,whiteSpace:'nowrap'}} {...props} />
                          ),
                          td: ({node, ...props}) => (
                            <td style={{border:'1px solid #e2e8f0',padding:'6px 10px'}} {...props} />
                          ),
                          h1: ({node, ...props}) => <h1 style={{fontSize:'15px',fontWeight:800,margin:'10px 0 4px'}} {...props} />,
                          h2: ({node, ...props}) => <h2 style={{fontSize:'14px',fontWeight:700,margin:'10px 0 4px'}} {...props} />,
                          h3: ({node, ...props}) => <h3 style={{fontSize:'13px',fontWeight:700,margin:'8px 0 4px'}} {...props} />,
                          p: ({node, ...props}) => <p style={{margin:'4px 0',lineHeight:'1.6'}} {...props} />,
                          strong: ({node, ...props}) => <strong style={{fontWeight:700}} {...props} />,
                          hr: ({node, ...props}) => <hr style={{border:'none',borderTop:'1px solid #e2e8f0',margin:'8px 0'}} {...props} />,
                          ul: ({node, ...props}) => <ul style={{paddingLeft:'16px',margin:'4px 0'}} {...props} />,
                          ol: ({node, ...props}) => <ol style={{paddingLeft:'16px',margin:'4px 0'}} {...props} />,
                          li: ({node, ...props}) => <li style={{margin:'2px 0'}} {...props} />,
                          code: ({node, inline, ...props}) => inline
                            ? <code style={{background:'#f1f5f9',padding:'1px 5px',borderRadius:'4px',fontSize:'11px'}} {...props} />
                            : <pre style={{background:'#f1f5f9',padding:'8px',borderRadius:'8px',overflowX:'auto',fontSize:'11px'}}><code {...props} /></pre>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                    <Loader2 size={14} className="text-indigo-600 animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">Analyzing System Context</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/5 bg-white">
              <form onSubmit={handleSend} className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Ask Intel anything about your hostel..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pr-14 text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none min-h-[60px] max-h-[150px]"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition-all shadow-lg ${
                    input.trim() && !loading 
                      ? 'bg-indigo-600 text-white shadow-indigo-600/30' 
                      : 'bg-slate-100 text-slate-300 pointer-events-none'
                  }`}
                >
                  <Send size={18} strokeWidth={2.5} />
                </button>
              </form>
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex gap-4">
                  <button type="button" onClick={() => setInput("Summarize complaints")} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest">Complaints</button>
                  <button type="button" onClick={() => setInput("Who are the top debtors?")} className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest">Fees</button>
                </div>
                <div className="text-[9px] font-bold text-slate-300 flex items-center gap-1 uppercase tracking-widest">
                  <Zap size={10} className="fill-slate-300" /> Powered by Gemini
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
