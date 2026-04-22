"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, User as UserIcon, Users, CreditCard, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const MOBILE_ITEMS = [
  { name: "Dash", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Profile", href: "/student/profile", icon: UserIcon },
  { name: "Visitors", href: "/student/visitors", icon: Users },
  { name: "Ledger", href: "/student/payments", icon: CreditCard },
  { name: "Support", href: "/student/complaints", icon: MessageSquare },
];

export default function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
      <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl shadow-black/40 px-4 py-3 flex items-center justify-between">
        {MOBILE_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.href} className="relative flex flex-col items-center gap-1 group">
              <div className={`p-3 rounded-2xl transition-all duration-300 relative ${
                isActive ? "bg-indigo-600 text-white -translate-y-4 shadow-xl shadow-indigo-600/40 scale-110" : "text-slate-400 hover:text-slate-200"
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "rotate-3" : ""} />
                {isActive && (
                   <motion.div 
                     layoutId="mobileActive"
                     className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                   />
                )}
              </div>
              {!isActive && (
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity italic">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
