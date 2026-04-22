"use client";

import { useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { Loader2, Mail, X } from "lucide-react";
import axios from "axios";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      addToast("If an account exists with this email, a password reset link has been sent.", "success");
      onClose();
    } catch (err) {
      console.error("Password reset error:", err);
      addToast("Error sending password reset link.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleResetPassword} className="p-6 space-y-6">
          <p className="text-slate-500 text-sm font-medium">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
