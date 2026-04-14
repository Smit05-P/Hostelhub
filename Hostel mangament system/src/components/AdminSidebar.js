"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Bed, CreditCard, Bell, LogOut, X, 
  ChevronLeft, ChevronRight, User as UserIcon, Shield,
  ArrowLeftRight, MessageSquare, UserCheck, BarChart3,
  Cpu, GraduationCap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const NavTooltip = ({ label, children, show }) => {
  if (!show) return children;
  return (
    <div className="relative group/tip flex">
      {children}
      <div className="pointer-events-none absolute left-full ml-3 z-[999] px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-[11px] font-bold text-white uppercase tracking-widest whitespace-nowrap shadow-2xl opacity-0 -translate-x-1 group-hover/tip:opacity-100 group-hover/tip:translate-x-0 transition-all duration-200 top-1/2 -translate-y-1/2">
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
      </div>
    </div>
  );
};

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Students",      href: "/admin/students",      icon: GraduationCap },
      { name: "Rooms",         href: "/admin/rooms",         icon: Bed },
      { name: "Join Requests", href: "/admin/join-requests", icon: UserCheck },
      { name: "Allocation",    href: "/admin/allocation",    icon: ArrowLeftRight },
    ],
  },
  {
    label: "Finance & Operations",
    items: [
      { name: "Fees", href: "/admin/fees", icon: CreditCard },
      { name: "Complaints", href: "/admin/complaints", icon: MessageSquare },
      { name: "Visitors", href: "/admin/visitors", icon: UserCheck },
    ],
  },
  {
    label: "Analytics & Info",
    items: [
      { name: "Reports", href: "/admin/reports", icon: BarChart3 },
      { name: "Notices", href: "/admin/notices", icon: Bell },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, activeHostelData, isHostelSelected } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  if (!mounted) {
    return (
      <div className="fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0d1117] w-20 md:w-64 border-r border-white/[0.04]" />
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <motion.div
        animate={{ 
          width: isCollapsed ? 80 : 256,
          x: isOpen || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 0 : -256 
        }}
        initial={false}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: "linear-gradient(160deg, #0d1117 0%, #0a0f1e 60%, #0d1433 100%)" }}
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col text-slate-300 h-screen
          md:static border-r border-white/[0.04] overflow-hidden
        `}
      >
        {/* Background glow orbs */}
        <div className="absolute top-0 left-0 w-full h-80 pointer-events-none overflow-hidden">
          <div className="absolute top-[-60px] left-[-40px] w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full" />
          <div className="absolute top-[40px] right-[-20px] w-32 h-32 bg-indigo-500/8 blur-[60px] rounded-full" />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-4 top-12 w-8 h-8 bg-blue-600 rounded-full items-center justify-center text-white border-4 border-[#0d1117] hover:bg-blue-500 transition-all z-50 shadow-xl shadow-blue-600/30"
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* Logo */}
        <div className={`flex h-20 shrink-0 items-center px-6 relative z-10 border-b border-white/[0.05] ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/40">
              <Shield size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <h1 className="text-lg font-black text-white tracking-tight leading-none uppercase">HostelHub</h1>
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.25em] mt-1 flex items-center gap-1.5">
                    <Cpu size={8} />
                    Core Engine
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Hostel Switcher */}
        {isHostelSelected && !isCollapsed && (
          <div className="px-4 pt-5 pb-2 relative z-10">
            <Link
              href="/admin/hostels"
              className="group flex items-center justify-between p-3.5 bg-white/[0.04] border border-white/[0.07] rounded-2xl hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Facility Node</span>
                <span className="text-[13px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                  {activeHostelData?.hostelName || "Primary Hostel"}
                </span>
              </div>
              <ArrowLeftRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-3 py-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <AnimatePresence initial={false}>
                {!isCollapsed ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-[0.22em] text-slate-500 select-none"
                  >
                    {group.label}
                  </motion.p>
                ) : (
                  <div className="pt-3 pb-1 flex justify-center">
                    <span className="w-4 h-px bg-white/10 rounded-full block" />
                  </div>
                )}
              </AnimatePresence>

              <ul role="list" className="flex flex-col gap-y-1 mt-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <NavTooltip label={item.name} show={isCollapsed}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`
                            relative group flex items-center gap-x-3 rounded-xl p-2.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300
                            ${isActive
                              ? "bg-blue-600/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/20"
                              : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                            }
                            ${isCollapsed ? "justify-center" : "px-4"}
                            w-full
                          `}
                        >
                          <Icon
                            size={18}
                            strokeWidth={isActive ? 2.5 : 2}
                            className={`shrink-0 transition-all duration-300 ${
                              isActive ? "text-white scale-110" : "text-slate-500 group-hover:text-slate-200"
                            }`}
                          />
                          <AnimatePresence mode="wait">
                            {!isCollapsed && (
                              <motion.span 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="truncate"
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      </NavTooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

          <div className="mt-auto pt-4 border-t border-white/[0.05] space-y-1">
            <NavTooltip label={user?.email?.split("@")[0]} show={isCollapsed}>
              <div className={`flex items-center gap-3 p-3.5 rounded-xl ${isCollapsed ? "justify-center" : ""}`}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-lg shadow-blue-600/20">
                  {user?.email?.[0].toUpperCase() || <UserIcon size={16} />}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate uppercase tracking-tight">
                      {user?.email?.split("@")[0]}
                    </p>
                    <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-0.5 italic">
                      Systems Admin
                    </p>
                  </div>
                )}
              </div>
            </NavTooltip>

            <NavTooltip label="Sign Out" show={isCollapsed}>
              <button
                onClick={handleLogout}
                className={`
                  group flex items-center gap-x-3 w-full rounded-xl p-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300
                  text-slate-500 hover:bg-rose-500/10 hover:text-rose-400
                  ${isCollapsed ? "justify-center" : "px-4"}
                `}
              >
                <LogOut size={16} strokeWidth={2} className="shrink-0 group-hover:rotate-12 transition-transform duration-300" />
                {!isCollapsed && <span>Deauthorize</span>}
              </button>
            </NavTooltip>
          </div>
      </motion.div>
    </>
  );
}
