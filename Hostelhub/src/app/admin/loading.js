"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
          <Loader2 className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900 tracking-tight">Loading Dashboard...</p>
          <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}
