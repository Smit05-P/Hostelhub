"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SaaSInput({
  label,
  id,
  type = "text",
  placeholder,
  register,
  error,
  icon: Icon,
  showPasswordToggle = false,
  className = "",
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputType = showPasswordToggle ? (isVisible ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative group">
        {/* Floating Label Style */}
        <div className={`
          relative flex items-center w-full min-h-[64px] px-6 rounded-2xl border-2 transition-all duration-300 bg-white
          ${error 
            ? "border-red-200 bg-red-50/10 shadow-[0_0_0_4px_rgba(239,68,68,0.03)]" 
            : isFocused 
              ? "border-[#4F46E5] shadow-[0_0_0_4px_rgba(79,70,229,0.08)] bg-white" 
              : "border-slate-100 hover:border-slate-200"
          }
        `}>
          <div className="flex-1 flex flex-col pt-1">
            <span className={`
              text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200
              ${error ? "text-red-400" : isFocused ? "text-[#4F46E5]" : "text-slate-400"}
            `}>
              {label}
            </span>
            <input
              suppressHydrationWarning
              id={id}
              type={inputType}
              placeholder={placeholder}
              {...register}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full bg-transparent border-none outline-none text-[15px] font-bold text-slate-900 placeholder:text-slate-300 pb-1"
              {...props}
            />
          </div>
          
          <div className="flex items-center gap-3 pl-4">
            {showPasswordToggle ? (
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="text-slate-400 hover:text-[#4F46E5] transition-colors p-1.5 rounded-xl hover:bg-slate-50"
                tabIndex={-1}
              >
                {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            ) : Icon && (
              <Icon size={18} className={`transition-colors ${isFocused ? "text-[#4F46E5]" : "text-slate-300"}`} />
            )}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-1 -bottom-6 text-[11px] font-bold text-red-500 tracking-tight"
            >
              {error.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Password Strength Indicator (Simplified) */}
      {type === "password" && !error && isFocused && (
        <div className="flex gap-1.5 mt-1 px-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full w-full bg-emerald-400 opacity-30" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
