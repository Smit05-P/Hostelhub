"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Send, Sparkles, Loader2, Bot, User, 
  MessageSquare, Terminal, Zap, Info, Download, FileText, Copy
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
    const initialAssistantMsg = { role: "model", content: "" };
    
    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          hostelId: activeHostelId,
          role: role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to connect to Intel Node.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            role: "model", 
            content: accumulatedContent 
          };
          return newMessages;
        });
      }
    } catch (err) {
      const errorMsg = err.message || "Connection to Intel Node failed.";
      toast.error(errorMsg);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: "model", 
          content: `Error: ${errorMsg}. Please try again later.` 
        };
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadMessage = (content, filename = "intel-response.md") => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  const downloadEntireChat = () => {
    const content = messages.map(m => `### ${m.role === 'user' ? 'USER' : 'INTEL'}\n\n${m.content}\n\n---\n`).join("\n");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadMessage(content, `hostelhub-intel-chat-${timestamp}.md`);
  };

  const downloadPDF = (content, title = "Intel Intelligence Report") => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    
    // Header
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("HOSTELHUB INTEL", 20, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${timestamp}`, 20, 30);
    doc.text(`Subject: ${title}`, 20, 35);

    let cursorY = 50;
    doc.setTextColor(30, 41, 59); // Slate-800
    
    // Split content into blocks of text and tables
    const lines = content.split('\n');
    let tableLines = [];
    let isTable = false;

    const flushTable = () => {
      if (tableLines.length < 2) return;
      
      const headers = tableLines[0].split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
      const rows = tableLines.slice(2).map(line => 
        line.split('|').filter((_, index, array) => index > 0 && index < array.length - 1).map(cell => cell.trim())
      );

      autoTable(doc, {
        startY: cursorY,
        head: [headers],
        body: rows,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, font: "helvetica" },
        headStyles: { fillStyle: 'F', fillColor: [79, 70, 229], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didDrawPage: (data) => {
          cursorY = data.cursor.y;
        }
      });
      
      cursorY = (doc.lastAutoTable?.finalY || cursorY) + 10;
      tableLines = [];
      isTable = false;
    };

    const sanitizeText = (text) => {
      if (!text) return "";
      return text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '') // Remove emojis
        .replace(/\*\*/g, "") // Remove bold markdown
        .replace(/###/g, "") // Remove header markdown
        .replace(/^>\s?/gm, "") // Remove blockquote markdown
        .replace(/₹/g, "Rs.") // Replace Rupee with Rs. (more compatible)
        .replace(/[\u2018\u2019]/g, "'") // Smart quotes
        .replace(/[\u201C\u201D]/g, '"') // Smart quotes
        .replace(/\u2013/g, "-") // En dash
        .replace(/\u2014/g, "--") // Em dash
        .replace(/[^\x00-\x7F]/g, "") // Strip any other non-ASCII characters to prevent garbled PDF
        .trim();
    };

    const renderText = (text, x, y, maxWidth, isBold = false) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const cleanText = sanitizeText(text);
      if (!cleanText) return y;
      const splitLines = doc.splitTextToSize(cleanText, maxWidth);
      splitLines.forEach(l => {
        if (y > 275) { doc.addPage(); y = 25; }
        doc.text(l, x, y);
        y += 7;
      });
      return y;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Detect Role Headers
      if (trimmed.startsWith('[USER]') || trimmed.startsWith('[INTEL]')) {
        if (cursorY > 260) { doc.addPage(); cursorY = 25; }
        doc.setFillColor(trimmed.includes('INTEL') ? 240 : 248, 242, 255);
        doc.rect(20, cursorY - 5, 170, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(trimmed.includes('INTEL') ? 79 : 100, 70, 229);
        doc.text(sanitizeText(trimmed), 25, cursorY);
        cursorY += 12;
        return;
      }

      const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|');

      if (isTableLine) {
        isTable = true;
        tableLines.push(line);
      } else {
        if (isTable) {
          // Flush Table with Sanitzation
          if (tableLines.length >= 2) {
            const headers = tableLines[0].split('|').filter(cell => cell.trim() !== '').map(cell => sanitizeText(cell));
            const rows = tableLines.slice(2).map(line => 
              line.split('|').filter((_, index, array) => index > 0 && index < array.length - 1).map(cell => sanitizeText(cell))
            );

            autoTable(doc, {
              startY: cursorY,
              head: [headers],
              body: rows,
              margin: { left: 20, right: 20 },
              styles: { fontSize: 9, font: "helvetica" },
              headStyles: { fillStyle: 'F', fillColor: [79, 70, 229], textColor: 255 },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              didDrawPage: (data) => {
                cursorY = data.cursor.y;
              }
            });
            cursorY = (doc.lastAutoTable?.finalY || cursorY) + 10;
          }
          tableLines = [];
          isTable = false;
        }

        if (trimmed !== '') {
          doc.setFontSize(11);
          doc.setTextColor(30, 41, 59);
          const isHeader = trimmed.startsWith('###') || trimmed.startsWith('**');
          cursorY = renderText(trimmed, 20, cursorY, 170, isHeader);
        } else {
          cursorY += 4;
        }
      }

      if (index === lines.length - 1 && isTable) {
         // Final table flush logic same as above
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount} | Official HostelHub Intelligence Report | ${new Date().toLocaleDateString()}`, 105, 290, { align: "center" });
    }

    doc.save(`intel-report-${new Date().getTime()}.pdf`);
    toast.success("Premium PDF Exported");
  };

  const downloadEntireChatPDF = () => {
    const content = messages.map(m => `[${m.role === 'user' ? 'USER' : 'INTEL'}]\n${m.content}\n\n------------------\n`).join("\n");
    downloadPDF(content, "Full Conversation Logs");
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
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={downloadEntireChatPDF}
                  title="Download Chat as PDF"
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-rose-600"
                >
                  <FileText size={20} />
                </button>
                <button 
                  onClick={downloadEntireChat}
                  title="Download Chat as Markdown"
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-indigo-600"
                >
                  <Download size={20} />
                </button>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>
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
                  <div className={`relative group max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                  }`}>
                    {/* Message Action Bar */}
                    {m.role === 'model' && (
                      <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(m.content);
                            toast.success("Copied to clipboard");
                          }}
                          className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                          title="Copy Content"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => downloadPDF(m.content, "AI Response Detail")}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          title="Download as PDF"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => downloadMessage(m.content)}
                          className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
                          title="Download as Markdown"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none prose-slate">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <div className="my-4 overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                              <table className="w-full border-collapse text-[12px] bg-white" {...props} />
                            </div>
                          ),
                          th: ({node, ...props}) => (
                            <th className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 px-4 py-3 text-left font-bold text-slate-900 uppercase tracking-wider" {...props} />
                          ),
                          td: ({node, ...props}) => (
                            <td className="border-b border-slate-50 px-4 py-2.5 text-slate-600 font-medium" {...props} />
                          ),
                          h1: ({node, ...props}) => <h1 className="text-base font-black text-slate-900 mt-6 mb-3 flex items-center gap-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-sm font-bold text-slate-800 mt-5 mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-[13px] font-bold text-indigo-600 mt-4 mb-2 uppercase tracking-wide" {...props} />,
                          p: ({node, ...props}) => <p className="my-2 leading-relaxed text-slate-600" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                          hr: ({node, ...props}) => <hr className="my-6 border-slate-100" {...props} />,
                          ul: ({node, ...props}) => <ul className="pl-5 my-3 space-y-1 list-disc text-slate-600" {...props} />,
                          ol: ({node, ...props}) => <ol className="pl-5 my-3 space-y-1 list-decimal text-slate-600" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />,
                          code: ({node, inline, ...props}) => inline
                            ? <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-[11px]" {...props} />
                            : <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto my-4 shadow-inner"><code className="text-indigo-300 font-mono text-[11px]" {...props} /></pre>,
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
                  <Zap size={10} className="fill-slate-300" /> Powered by Intel Core
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
