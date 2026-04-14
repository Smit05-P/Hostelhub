"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  ClipboardCopy, 
  Share2, 
  Maximize2, 
  X, 
  Check,
  QrCode,
  ArrowRight
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";

// ─── TOOLTIP COMPONENT ────────────────────────────────────────────────────────
export const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg pointer-events-none z-50 whitespace-nowrap shadow-xl border border-slate-700/50"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── AUTO-APPROVE TOGGLE ──────────────────────────────────────────────────────
export const AutoApproveToggle = ({ enabled, onToggle, loading }) => {
  return (
    <div className="flex flex-col gap-1.5 min-w-[100px]">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
          {enabled ? "Auto" : "Manual"}
        </span>

        <div 
          onClick={() => !loading && onToggle()}
          className={`relative w-14 h-7 rounded-full cursor-pointer transition-all duration-300 shadow-inner overflow-hidden ${
            enabled ? 'bg-indigo-600 shadow-indigo-900/10' : 'bg-slate-200 shadow-slate-300/50'
          } ${loading ? 'opacity-70 pointer-events-none' : 'active:scale-95'}`}
        >
          {/* Subtle Labels in track */}
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
             <span className={`text-[7px] font-black transition-opacity ${enabled ? 'opacity-100 text-white/50' : 'opacity-0'}`}>ON</span>
             <span className={`text-[7px] font-black transition-opacity ${!enabled ? 'opacity-100 text-slate-400' : 'opacity-0'}`}>OFF</span>
          </div>

          <motion.div
            initial={false}
            animate={{ 
              x: enabled ? 30 : 4,
            }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              mass: 0.8
            }}
            className={`absolute top-1 w-5 h-5 rounded-full shadow-md flex items-center justify-center transition-colors duration-300 ${
               enabled ? 'bg-white' : 'bg-[#475569]'
            }`}
          >
             {loading && (
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                 className={`w-3 h-3 border-2 rounded-full border-t-indigo-500 ${enabled ? 'border-indigo-100' : 'border-slate-500'}`}
               />
             )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ─── JOIN CODE DISPLAY ────────────────────────────────────────────────────────
export const JoinCodeDisplay = ({ code, onExpand }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleReveal = () => setRevealed(!revealed);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!", {
      style: {
        background: '#0F172A',
        color: '#fff',
        fontSize: '10px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    });
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/join/${code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join our Hostel',
        text: `Use this code to join our hostel: ${code}`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  }, [code]);

  return (
    <div className="space-y-4" suppressHydrationWarning>
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-[2rem] relative overflow-hidden group shadow-inner">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20" />
        
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic mb-6">Student Access Portal</p>
        
        <div className="relative flex flex-col items-center gap-2">
          <motion.div 
            layout
            className="text-5xl font-black text-slate-900 tracking-[0.2em] font-mono select-all italic"
          >
            {revealed ? (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {code || "----"}
              </motion.span>
            ) : (
              <span className="text-slate-200 uppercase">Hidden</span>
            )}
          </motion.div>
          
          <div className="flex items-center gap-4 mt-8">
            <Tooltip text={revealed ? "Hide Code" : "Show Code"}>
              <button 
                onClick={toggleReveal}
                className="p-3 bg-white border border-slate-200 hover:border-indigo-500 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
              >
                {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Tooltip>

            <Tooltip text="Copy Code">
              <button 
                onClick={handleCopy}
                className={`p-3 bg-white border border-slate-200 rounded-xl transition-all shadow-sm active:scale-90 ${
                  copied ? "text-emerald-500 border-emerald-500 shadow-emerald-500/10" : "text-slate-400 hover:text-indigo-600 hover:border-indigo-500"
                }`}
              >
                {copied ? <Check size={18} /> : <ClipboardCopy size={18} />}
              </button>
            </Tooltip>

            <Tooltip text="Share Access Link">
              <button 
                onClick={handleShare}
                className="p-3 bg-white border border-slate-200 hover:border-indigo-500 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm active:scale-90"
              >
                <Share2 size={18} />
              </button>
            </Tooltip>

            <Tooltip text="View Full Mode">
              <button 
                onClick={onExpand}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-90"
              >
                <Maximize2 size={18} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EXPANDABLE CODE MODAL ────────────────────────────────────────────────────
export const ExpandableCodeModal = ({ isOpen, onClose, code, hostelName }) => {
  if (!isOpen) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${code}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl"
        onClick={onClose}
        suppressHydrationWarning
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row"
          onClick={e => e.stopPropagation()}
          suppressHydrationWarning
        >
          {/* Close Button Mobile */}
          <button 
            onClick={onClose}
            className="md:hidden absolute top-6 right-6 p-4 bg-slate-100 rounded-2xl text-slate-500 active:scale-90 transition-all z-10"
          >
            <X size={24} />
          </button>

          {/* QR Section */}
          <div className="bg-slate-50 p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 flex-1">
             <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-200 flex items-center justify-center relative group">
                <QRCodeSVG value={shareUrl} size={200} level="H" includeMargin={true} />
                <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/0 transition-all rounded-[2.5rem] pointer-events-none" />
             </div>
             <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <QrCode size={18} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scan to Initialize Join Request</span>
             </div>
          </div>

          {/* Actions Section */}
          <div className="p-12 flex-1 flex flex-col justify-between">
            <div className="space-y-12">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">{hostelName}</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">Facility Join Key</p>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Secure Join Code</p>
                 <div className="text-6xl font-black text-slate-900 tracking-[0.2em] font-mono italic">
                   {code}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success("Code Captured!");
                  }}
                  className="flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all active:scale-95 italic"
                >
                  <ClipboardCopy size={16} />
                  Copy Code
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link Synchronized!");
                  }}
                  className="flex items-center justify-center gap-3 py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all active:scale-95 italic"
                >
                  <Share2 size={16} />
                  Share Link
                </button>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="mt-12 w-full py-5 border border-slate-200 text-slate-400 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-slate-50 hover:text-rose-500 hover:border-rose-100 transition-all italic flex items-center justify-center gap-4"
            >
              Return to Dashboard
              <X size={16} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
