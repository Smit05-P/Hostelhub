"use client";

import { motion } from "framer-motion";

export default function SaaSRoleToggle({ role, setRole, className = "" }) {
  const isAdmin = role === "admin";

  return (
    <div className={`relative flex p-1.5 bg-slate-50 rounded-full border border-slate-100 shadow-inner transition-all duration-300 ${className}`}>

      {/* Student Tab */}
      <button
        type="button"
        onClick={() => setRole("student")}
        className={`relative flex-1 flex items-center justify-center gap-3 py-3.5 text-[14px] font-bold transition-all duration-300 rounded-full group ${!isAdmin ? "text-white" : "text-slate-400 hover:text-slate-600"
          }`}
      >
        {!isAdmin && (
          <motion.div
            layoutId="activeRoleTab"
            className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full shadow-[0_4px_15px_rgba(79,70,229,0.3)]"
            transition={{ type: "spring", bounce: 0.22, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 text-[16px] transition-transform group-hover:scale-110"></span>
        <span className="relative z-10 tracking-tight">Student Access</span>
      </button>

      {/* Admin Tab */}
      <button
        type="button"
        onClick={() => setRole("admin")}
        className={`relative flex-1 flex items-center justify-center gap-3 py-3.5 text-[14px] font-bold transition-all duration-300 rounded-full group ${isAdmin ? "text-white" : "text-slate-400 hover:text-slate-600"
          }`}
      >
        {isAdmin && (
          <motion.div
            layoutId="activeRoleTab"
            className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full shadow-[0_4px_15px_rgba(79,70,229,0.3)]"
            transition={{ type: "spring", bounce: 0.22, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 text-[16px] transition-transform group-hover:scale-110"></span>
        <span className="relative z-10 tracking-tight">Admin Control</span>
      </button>
    </div>
  );
}
