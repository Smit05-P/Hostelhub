"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  const isPassword = type === "password" || (type === "text" && isVisible && showPasswordToggle);
  const inputType = showPasswordToggle ? (isVisible ? "text" : "password") : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[#0F172A] tracking-tight"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          {...register}
          className={`
            w-full h-[52px] px-4 rounded-xl border-1.5 text-sm font-normal text-[#0F172A]
            placeholder:text-[#CBD5E1] transition-all duration-200 outline-none
            ${error 
              ? "border-red-500 bg-red-50/50 shadow-[0_0_0_4px_rgba(239,68,68,0.05)] animate-shake" 
              : "border-[#E2E8F0] focus:border-[#4F46E5] focus:shadow-[0_0_0_4px_rgba(79,70,229,0.1)]"
            }
          `}
          {...props}
        />
        
        {/* Right Icon / Toggle Area */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showPasswordToggle ? (
            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="text-[#94A3B8] hover:text-[#4F46E5] transition-colors p-1"
              tabIndex={-1}
            >
              {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          ) : Icon && (
            <Icon size={18} className="text-[#94A3B8] pointer-events-none" />
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-[11px] font-medium text-red-500 animate-fade-in pl-1">
          {error.message}
        </p>
      )}
    </div>
  );
}
