"use client";

import { UserCircle, ShieldCheck } from "lucide-react";

export default function SaaSRoleToggle({ role, setRole, className = "" }) {
  const isAdmin = role === "admin";

  return (
    <div className={`relative flex p-1.5 bg-[#F1F5F9] rounded-[14px] border-1.5 border-[#E2E8F0] transition-all duration-300 ${className}`}>
      
      {/* Sliding Indicator (Indigo Pill) */}
      <div 
        className={`absolute left-1.5 top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#4F46E5] rounded-[10px] shadow-md shadow-indigo-100 transition-all duration-300 transform ${
          isAdmin ? "translate-x-full" : "translate-x-0"
        }`}
      />
      
      {/* Student Tab */}
      <button
        type="button"
        onClick={() => setRole("student")}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors duration-300 ${
          !isAdmin ? "text-white" : "text-[#64748B] hover:text-[#4F46E5]"
        }`}
      >
        <span className="text-sm">🎓</span>
        <span>Student</span>
      </button>

      {/* Admin Tab */}
      <button
        type="button"
        onClick={() => setRole("admin")}
        className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold transition-colors duration-300 ${
          isAdmin ? "text-white" : "text-[#64748B] hover:text-[#4F46E5]"
        }`}
      >
        <span className="text-sm">🛡️</span>
        <span>Admin</span>
      </button>
    </div>
  );
}
