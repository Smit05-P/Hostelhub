import React from "react";

export function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-[#4F46E5]/15 border border-[#4F46E5]/30 text-[#A5B4FC]",
    success: "bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]",
    solid: "bg-[#4F46E5] border border-transparent text-white",
  };

  return (
    <div className={`inline-flex items-center rounded-full px-3 py-1 font-medium text-[12px] uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
