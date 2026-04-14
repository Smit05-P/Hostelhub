"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function IntelFAB({ onClick }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.5)] transition-shadow group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      <Sparkles size={24} className="text-white fill-white animate-pulse" />
      
      {/* Decorative rings */}
      <div className="absolute inset-0 border-2 border-white/20 rounded-2xl animate-ping opacity-20" style={{ animationDuration: '3s' }} />
    </motion.button>
  );
}
