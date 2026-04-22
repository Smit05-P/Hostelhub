"use client";

import { User, ShieldCheck, ArrowRight } from "lucide-react";
import SaaSButton from "./SaaSButton";

export default function RoleSelectionModal({ isOpen, onSelect, isLoading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#F0F4FF]/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(79,70,229,0.15)] border border-[#E2E8F0] p-8 md:p-10 animate-scale-up">
        <div className="text-center space-y-2 mb-8">
          <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            How will you use HostelHub?
          </h3>
          <p className="text-sm font-medium text-[#64748B]">
            One last step to set up your profile
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelect("student")}
            disabled={isLoading}
            className="w-full group relative flex items-center gap-4 p-5 bg-[#F8FAFC] border-2 border-transparent hover:border-[#4F46E5] hover:bg-white rounded-2xl transition-all duration-300 text-left active:scale-[0.98] disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <User className="text-[#4F46E5] w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-[#0F172A]">I am a Student</p>
              <p className="text-[12px] text-[#64748B] font-medium">Join a hostel and manage your stay</p>
            </div>
            <ArrowRight className="ml-auto w-4 h-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </button>

          <button
            onClick={() => onSelect("admin")}
            disabled={isLoading}
            className="w-full group relative flex items-center gap-4 p-5 bg-[#F8FAFC] border-2 border-transparent hover:border-[#06B6D4] hover:bg-white rounded-2xl transition-all duration-300 text-left active:scale-[0.98] disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-cyan-50 transition-colors">
              <ShieldCheck className="text-[#06B6D4] w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-[#0F172A]">I am an Admin</p>
              <p className="text-[12px] text-[#64748B] font-medium">Manage your hostel and students</p>
            </div>
            <ArrowRight className="ml-auto w-4 h-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </button>
        </div>

        <p className="text-center text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.2em] mt-8">
          Welcome to the future of hosting
        </p>
      </div>
    </div>
  );
}
