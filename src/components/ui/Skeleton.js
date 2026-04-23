"use client";

import { motion } from "framer-motion";

export const Shimmer = ({ className }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-100 rounded-lg ${className}`}>
      <motion.div
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export const SkeletonCard = ({ className = "" }) => (
  <div className={`premium-glass p-8 rounded-[2.5rem] border border-slate-200/60 shadow-xl ${className}`}>
    <div className="flex items-start justify-between mb-8">
      <Shimmer className="w-12 h-12 rounded-2xl" />
      <Shimmer className="w-20 h-6 rounded-full" />
    </div>
    <Shimmer className="w-32 h-10 rounded-xl mb-4" />
    <Shimmer className="w-24 h-4 rounded-full" />
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-6 py-4">
    <Shimmer className="w-16 h-16 rounded-2xl" />
    <div className="flex-1 space-y-3">
      <Shimmer className="w-1/3 h-5 rounded-lg" />
      <Shimmer className="w-1/4 h-3 rounded-lg" />
    </div>
    <Shimmer className="w-24 h-10 rounded-2xl" />
  </div>
);

export const SkeletonHero = () => (
  <div className="relative overflow-hidden rounded-[3rem] bg-slate-100 p-12 lg:p-20 border border-slate-200 shadow-xl">
    <div className="max-w-3xl space-y-8">
      <Shimmer className="w-48 h-8 rounded-full" />
      <Shimmer className="w-full h-24 rounded-3xl" />
      <Shimmer className="w-2/3 h-6 rounded-full" />
    </div>
  </div>
);
