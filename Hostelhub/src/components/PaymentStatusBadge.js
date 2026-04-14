"use client";

import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

export default function PaymentStatusBadge({ status }) {
  const normalized = status?.toLowerCase() || "pending";
  
  const configs = {
    paid: {
      label: "Cleared",
      classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: CheckCircle2
    },
    pending: {
      label: "Awaiting",
      classes: "bg-amber-50 text-amber-600 border-amber-100",
      icon: Clock
    },
    overdue: {
      label: "Breached",
      classes: "bg-rose-50 text-rose-600 border-rose-100 animate-pulse",
      icon: AlertCircle
    }
  };

  const config = configs[normalized] || configs.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] italic ${config.classes} shadow-sm`}>
      <Icon size={12} strokeWidth={3} />
      {config.label}
    </span>
  );
}
