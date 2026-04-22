"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * AdminTemplate
 * 
 * Provides a global entry/exit animation for all admin pages.
 * Using template.js ensures the animation triggers on every navigation.
 */
export default function AdminTemplate({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for premium feel
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
