"use client";

import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SaaSButton({
  children,
  onClick,
  type = "button",
  isLoading = false,
  loadingText,
  variant = "primary", // primary, white
  icon: Icon,
  className = "",
  disabled = false,
  ...props
}) {
  const baseStyles = "relative w-full h-[52px] rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_15px_25px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    white: "bg-white border-2 border-slate-100 text-slate-800 hover:border-slate-200 hover:bg-slate-50 shadow-sm active:scale-[0.98]"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      {...props}
    >
      {/* Shimmer Sweep Effect */}
      <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"
           style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }} />

      {isLoading ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          {loadingText && <span className="tracking-wide">{loadingText}</span>}
        </>
      ) : (
        <>
          {Icon && <Icon size={20} className="transition-transform group-hover:scale-110" />}
          <span className="relative z-10 tracking-tight">{children}</span>
        </>
      )}
    </motion.button>
  );
}

