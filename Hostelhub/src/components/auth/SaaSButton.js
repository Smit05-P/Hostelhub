"use client";

import { Loader2 } from "lucide-react";

export default function SaaSButton({
  children,
  onClick,
  type = "button",
  isLoading = false,
  variant = "primary", // primary, white
  icon: Icon,
  className = "",
  disabled = false,
  ...props
}) {
  const baseStyles = "w-full h-[52px] rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white shadow-lg shadow-indigo-100 hover:shadow-xl hover:shadow-indigo-200 hover:scale-[1.01] disabled:opacity-50 disabled:pointer-events-none",
    white: "bg-white border-1.5 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-colors"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={20} />}
          {children}
        </>
      )}
    </button>
  );
}
