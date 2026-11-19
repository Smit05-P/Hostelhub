"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Send, Sparkles, Loader2, Bot, User, Zap, Info, Download, FileText, File as FileIcon, Copy, AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function IntelSidebar({ isOpen, onClose }) {
  const { activeHostelId, role } = useAuth();
  const [messages, setMessages] = useState([
    { 
      role: "model", 
      content: `Hello! I'm HostelHub Intel. I can answer questions using the hostel data available to your account. How can I assist you ${role === "admin" ? "with management today" : "with your stay"}?`
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

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error?.message || `Intel request failed (HTTP ${response.status}).`);
      }
      if (!result?.success) {
        throw new Error(result?.error?.message || "Intel could not generate an answer.");
      }
      if (typeof result.answer !== "string" || !result.answer.trim()) {
        throw new Error("Intel received an empty answer. Please try again or contact your administrator.");
      }

      const sections = [
        result.summary && `### Summary\n${result.summary}`,
        result.answer && `### Answer\n${result.answer}`,
        result.keyInsights?.length && `### Key insights\n${result.keyInsights.map((item) => `- ${item}`).join("\n")}`,
        result.recommendations?.length && `### Recommendations\n${result.recommendations.map((item) => `- ${item}`).join("\n")}`,
      ].filter(Boolean);

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "model",
          content: sections.join("\n\n"),
        };
        return newMessages;
      });
    } catch (err) {
      const errorMsg = err.message || "Connection to Intel Node failed.";
      toast.error(errorMsg);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: "model", 
          content: errorMsg,
          error: true,
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

  const downloadDOCX = async (content, filename, title) => {
    try {
      const { createIntelReportDocxBlob } = await import("@/lib/intel-docx");
      const blob = await createIntelReportDocxBlob(content, title);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Word report downloaded");
    } catch (error) {
      console.error("[Intel] Word report export failed:", error);
      toast.error("The Word report could not be created. Please try again.");
    }
  };

  const downloadEntireChat = () => {
    const content = messages.map(m => `### ${m.role === 'user' ? 'USER' : 'INTEL'}\n\n${m.content}\n\n---\n`).join("\n");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadMessage(content, `hostelhub-intel-chat-${timestamp}.md`);
  };

  const downloadPDF = async (content, title = "Intel Intelligence Report") => {
    try {
      const { createIntelReportPdf } = await import("@/lib/intel-pdf");
      const doc = createIntelReportPdf(content, title);
      doc.save(`intel-report-${Date.now()}.pdf`);
      toast.success("Intel report PDF downloaded");
    } catch (error) {
      console.error("[Intel] PDF report export failed:", error);
      toast.error("The PDF report could not be created. Please try again.");
    }
  };

  const downloadAllReportsPDF = () => {
    const reports = messages.filter((message, index) =>
      index > 0
      && message.role === "model"
      && !message.error
      && message.content?.trim()
    );

    if (reports.length === 0) {
      toast.error("There are no Intel reports to download yet.");
      return;
    }

    const content = reports
      .map((report, index) => `# Report ${index + 1}\n\n${report.content}`)
      .join("\n\n---\n\n");
    downloadPDF(content, `All Intel Reports (${reports.length})`);
  };

  const downloadAllReportsDOCX = () => {
    const reports = messages.filter((message, index) =>
      index > 0
      && message.role === "model"
      && !message.error
      && message.content?.trim()
    );

    if (reports.length === 0) {
      toast.error("There are no Intel reports to download yet.");
      return;
    }

    const content = reports
      .map((report, index) => `# Report ${index + 1}\n\n${report.content}`)
      .join("\n\n---\n\n");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    downloadDOCX(
      content,
      `hostelhub-intel-reports-${timestamp}.docx`,
      `All Intel Reports (${reports.length})`
    );
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
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
                  <Sparkles size={20} className="text-white fill-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold leading-tight tracking-wide text-slate-900 sm:text-base">HostelHub Intel</h2>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate text-[10px] font-semibold tracking-wide text-slate-500">Hostel data assistant</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  onClick={downloadAllReportsPDF}
                  title="Download all Intel reports as PDF"
                  aria-label="Download all Intel reports as PDF"
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  <FileText size={20} />
                </button>
                <button
                  onClick={downloadAllReportsDOCX}
                  title="Download all Intel reports as Word"
                  aria-label="Download all Intel reports as Word"
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  <FileIcon size={20} />
                </button>
                <button 
                  onClick={downloadEntireChat}
                  title="Download Chat as Markdown"
                  aria-label="Download conversation as Markdown"
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  <Download size={20} />
                </button>
                <button onClick={onClose} aria-label="Close HostelHub Intel" className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 scrollbar-hide"
            >
              <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
                <Info size={16} className="shrink-0 text-blue-700" />
                <span>Ask general questions or about authorized hostel records. Use the PDF or Word icons above to export all successful reports from this chat.</span>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={`flex min-w-0 items-start gap-2.5 sm:gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    m.role === "user" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-indigo-700"
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3.5 text-[14px] leading-6 shadow-sm sm:px-5 ${
                    m.role === "user"
                      ? "rounded-tr-md bg-indigo-700 text-white"
                      : m.error
                        ? "rounded-tl-md border border-rose-200 bg-rose-50 text-rose-900"
                        : "rounded-tl-md border border-slate-200 bg-white text-slate-800"
                  }`}>
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap break-words font-medium text-white">{m.content}</p>
                    ) : m.error ? (
                      <div className="flex items-start gap-2.5" role="alert">
                        <AlertCircle size={18} className="mt-1 shrink-0 text-rose-700" />
                        <p className="break-words text-[14px] leading-6 text-rose-900">{m.content}</p>
                      </div>
                    ) : (
                      <>
                      <div className="mb-3 flex items-center justify-end gap-1 border-b border-slate-100 pb-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(m.content);
                            toast.success("Copied to clipboard");
                          }}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                          title="Copy response"
                          aria-label="Copy response"
                        >
                          <Copy size={15} />
                        </button>
                        <button 
                          onClick={() => downloadPDF(m.content, "AI Response Detail")}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                          title="Download response as PDF"
                          aria-label="Download response as PDF"
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          onClick={() => {
                            const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
                            downloadDOCX(
                              m.content,
                              `hostelhub-intel-report-${timestamp}.docx`,
                              "Intel Report"
                            );
                          }}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                          title="Download response as Word"
                          aria-label="Download response as Word"
                        >
                          <FileIcon size={15} />
                        </button>
                        <button 
                          onClick={() => downloadMessage(m.content)}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                          title="Download response as Markdown"
                          aria-label="Download response as Markdown"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                      <div className="min-w-0 max-w-full text-[14px] leading-7 text-slate-700">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ node, ...props }) => (
                              <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[420px] border-collapse text-left text-[13px]" {...props} />
                              </div>
                            ),
                            th: ({ node, ...props }) => (
                              <th className="border-b border-slate-200 bg-indigo-50 px-3 py-2.5 text-left text-xs font-bold text-indigo-950" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                              <td className="border-b border-slate-100 px-3 py-2.5 align-top text-[13px] leading-5 text-slate-700" {...props} />
                            ),
                            h1: ({ node, ...props }) => <h1 className="mb-3 mt-5 text-lg font-bold leading-snug text-slate-950 first:mt-0" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="mb-2 mt-5 border-b border-slate-200 pb-2 text-base font-bold text-slate-900" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="mb-2 mt-4 text-sm font-bold text-indigo-800" {...props} />,
                            p: ({ node, ...props }) => <p className="my-2 break-words text-[14px] leading-7 text-slate-700" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-slate-950" {...props} />,
                            hr: ({ node, ...props }) => <hr className="my-4 border-slate-200" {...props} />,
                            ul: ({ node, ...props }) => <ul className="my-3 list-disc space-y-1 pl-5 text-[14px] leading-6 text-slate-700" {...props} />,
                            ol: ({ node, ...props }) => <ol className="my-3 list-decimal space-y-1 pl-5 text-[14px] leading-6 text-slate-700" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                            code: ({ node, className, children, ...props }) => (
                              <code className={`rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-800 ${className || ""}`} {...props}>
                                {children}
                              </code>
                            ),
                            pre: ({ node, ...props }) => <pre className="my-3 max-w-full overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100" {...props} />,
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                      </>
                    )}
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
            <div className="border-t border-slate-200 bg-white p-4 sm:p-6">
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
                  className="min-h-[60px] max-h-[150px] w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-4 pr-14 text-[15px] leading-6 text-slate-900 placeholder-slate-500 transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
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
                  <button type="button" onClick={() => setInput("Summarize complaints")} className="text-xs font-semibold text-slate-600 hover:text-indigo-700">Complaints</button>
                  <button type="button" onClick={() => setInput("Summarize fee records")} className="text-xs font-semibold text-slate-600 hover:text-indigo-700">Fees</button>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <Zap size={12} className="fill-slate-400 text-slate-500" /> Intel
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
