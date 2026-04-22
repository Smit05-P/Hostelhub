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

        <motion.div 
          onClick={() => !loading && onToggle()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-14 h-7 rounded-full cursor-pointer transition-all duration-300 shadow-inner overflow-hidden ${
            enabled ? 'bg-indigo-600 shadow-indigo-900/20 ring-4 ring-indigo-500/10' : 'bg-slate-200 shadow-slate-300/50'
          } ${loading ? 'opacity-70 pointer-events-none' : ''}`}
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
              stiffness: 800, 
              damping: 25,
              mass: 0.6
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
        </motion.div>
      </div>
    </div>
  );
};

export const InlineCodeActions = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("CODE CAPTURED", {
      style: {
        background: '#0F172A',
        color: '#fff',
        fontSize: '10px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        borderRadius: '12px',
      }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/join/${code}`;
    if (navigator.share) {
      navigator.share({ title: 'Join Hostel', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("LINK COPIED");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
       <motion.button
        whileHover={{ scale: 1.1, backgroundColor: "#EEF2FF" }}
        whileTap={{ scale: 0.9 }}
        onClick={handleCopy}
        className={`p-1.5 rounded-lg border transition-all ${copied ? 'text-emerald-500 border-emerald-500 bg-emerald-50' : 'text-slate-400 border-slate-200 bg-white'}`}
       >
         {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
       </motion.button>
       <motion.button
        whileHover={{ scale: 1.1, backgroundColor: "#EEF2FF" }}
        whileTap={{ scale: 0.9 }}
        onClick={handleShare}
        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-500 transition-all"
       >
         <Share2 size={12} />
       </motion.button>
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
export const ExpandableCodeModal = ({ hostel, onClose }) => {
  if (!hostel) return null;

  const code = hostel.joinCode || hostel.inviteCode || "----";
  const { hostelName } = hostel;
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${code}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-2xl"
        onClick={onClose}
        suppressHydrationWarning
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] w-full max-w-5xl overflow-hidden border border-white/20 flex flex-col lg:flex-row relative"
          onClick={e => e.stopPropagation()}
          suppressHydrationWarning
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* Close Button UI */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3.5 bg-slate-900 text-white rounded-[1.2rem] hover:bg-indigo-600 transition-all z-50 hover:rotate-90"
          >
            <X size={18} />
          </button>

          {/* LEFT: Identity Section */}
          <div className="p-10 md:p-14 lg:p-16 flex-1 flex flex-col justify-between relative z-10 border-r border-slate-100">
             <div className="space-y-12">
               <div className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] italic">HostelHub Secure Gateway</p>
                 </div>
                 <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tighter leading-tight uppercase italic break-words">
                   {hostelName}
                 </h3>
                 <p className="text-slate-400 font-medium text-base lg:text-lg leading-relaxed max-w-sm">
                   Share this unique access key with residents to initialize their digital induction.
                 </p>
               </div>

               <div className="space-y-6">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="h-px flex-1 bg-slate-100" />
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic px-4">Instant Access Key</span>
                   <div className="h-px flex-1 bg-slate-100" />
                 </div>
                 <div className="relative group/key">
                   <div className="absolute -inset-4 bg-indigo-500/5 rounded-[2rem] scale-95 opacity-0 group-hover/key:scale-100 group-hover/key:opacity-100 transition-all duration-500" />
                   <div className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-[0.1em] font-mono italic select-all py-2 relative overflow-hidden break-all">
                     {code}
                   </div>
                 </div>
               </div>
             </div>

             <div className="flex flex-col gap-4 mt-12 lg:mt-20">
               <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(code);
                     toast.success("KEY CAPTURED", { icon: <Check /> });
                   }}
                   className="flex-1 flex items-center justify-center gap-4 py-5 bg-slate-950 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all active:scale-95 italic group"
                 >
                   <ClipboardCopy size={16} className="group-hover:rotate-12 transition-transform" />
                   Copy Code
                 </button>
                 <button 
                   onClick={() => {
                     navigator.clipboard.writeText(shareUrl);
                     toast.success("LINK SYNCHRONIZED");
                   }}
                   className="flex-1 flex items-center justify-center gap-4 py-5 border-2 border-slate-950 text-slate-950 rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 transition-all active:scale-95 italic group"
                 >
                   <Share2 size={16} className="group-hover:scale-110 transition-transform" />
                   Access Link
                 </button>
               </div>
               <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest mt-4">
                 Security Notice: This key is unique to {hostelName}
               </p>
             </div>
          </div>

          {/* RIGHT: Visual/QR Section */}
          <div className="bg-slate-50/80 p-10 lg:p-16 flex flex-col items-center justify-center relative lg:min-w-[420px]">
             {/* QR Container */}
             <div className="relative">
                <div className="absolute -inset-10 bg-indigo-600/10 blur-[60px] rounded-full animate-pulse" />
                <motion.div 
                   whileHover={{ scale: 1.05 }}
                   className="bg-white p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(79,70,229,0.15)] border border-indigo-500/10 flex items-center justify-center relative z-10 overflow-hidden"
                >
                   {/* Decorative QR Corners */}
                   <div className="absolute top-0 left-0 w-8 lg:w-12 h-8 lg:h-12 border-t-2 border-l-2 border-indigo-500/20 translate-x-3 lg:translate-x-4 translate-y-3 lg:translate-y-4" />
                   <div className="absolute top-0 right-0 w-8 lg:w-12 h-8 lg:h-12 border-t-2 border-r-2 border-indigo-500/20 -translate-x-3 lg:-translate-x-4 translate-y-3 lg:translate-y-4" />
                   <div className="absolute bottom-0 left-0 w-8 lg:w-12 h-8 lg:h-12 border-b-2 border-l-2 border-indigo-500/20 translate-x-3 lg:translate-x-4 -translate-y-3 lg:-translate-y-4" />
                   <div className="absolute bottom-0 right-0 w-8 lg:w-12 h-8 lg:h-12 border-b-2 border-r-2 border-indigo-500/20 -translate-x-3 lg:-translate-x-4 -translate-y-3 lg:-translate-y-4" />
                   
                   <QRCodeSVG 
                      value={shareUrl} 
                      size={180} 
                      level="H" 
                      includeMargin={false}
                      className="drop-shadow-sm w-40 h-40 lg:w-60 lg:h-60" 
                   />
                </motion.div>
             </div>

             <div className="mt-12 lg:mt-16 text-center space-y-6 relative z-10">
                <div className="inline-flex items-center gap-4 px-6 lg:px-8 py-3 bg-white border border-slate-100 rounded-[1.2rem] lg:rounded-[1.5rem] shadow-sm">
                   <QrCode size={18} className="text-indigo-600" />
                   <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Scan Induction QR</span>
                </div>
                <p className="text-slate-400 text-xs lg:text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
                   Automate student onboarding by placing this QR at your facility entrance.
                </p>
                
                <div className="pt-6 lg:pt-8">
                  <button 
                    onClick={() => window.print()}
                    className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-indigo-500 border-b border-indigo-500/20 hover:border-indigo-500 pb-1 transition-all"
                  >
                    Generate Pass PDF
                  </button>
                </div>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
