"use client";

import { useState, useCallback, memo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Bell,
  LogOut,
  X,
  User as UserIcon,
  GraduationCap,
  MessageSquare,
  Users,
  Zap,
  Home,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// ─── NAV STRUCTURE (Grouped) ────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Home",
    items: [
      { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "My Residence",
    items: [
      { name: "Profile", href: "/student/profile", icon: UserIcon },
      { name: "Visitors", href: "/student/visitors", icon: Users },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Payments", href: "/student/payments", icon: CreditCard },
    ],
  },
  {
    label: "Support",
    items: [
      { name: "Complaints", href: "/student/complaints", icon: MessageSquare },
      { name: "Notices", href: "/student/notices", icon: Bell },
    ],
  },
];

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
const NavTooltip = ({ label, children, show }) => {
  if (!show) return children;
  return (
    <div className="relative group/tip flex">
      {children}
      <div
        className="
          pointer-events-none absolute left-full ml-3 z-[999]
          px-3 py-1.5 rounded-lg
          bg-slate-900 border border-white/10
          text-[11px] font-bold text-white uppercase tracking-widest
          whitespace-nowrap shadow-2xl
          opacity-0 -translate-x-1
          group-hover/tip:opacity-100 group-hover/tip:translate-x-0
          transition-all duration-200
          top-1/2 -translate-y-1/2
        "
      >
        {label}
        <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
      </div>
    </div>
  );
};

// ─── SINGLE NAV ITEM ─────────────────────────────────────────────────────────
const NavItem = memo(({ item, isActive, isCollapsed, onClick }) => {
  const Icon = item.icon;
  return (
    <NavTooltip label={item.name} show={isCollapsed}>
      <Link
        href={item.href}
        onClick={onClick}
        className={`
          relative group flex items-center gap-3 rounded-xl
          text-[11px] font-bold uppercase tracking-widest
          transition-all duration-200 w-full
          ${isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5"}
          ${
            isActive
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
          }
        `}
      >
        {/* Left bar for active */}
        {isActive && !isCollapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-full" />
        )}

        <Icon
          size={17}
          strokeWidth={isActive ? 2.5 : 2}
          className={`shrink-0 transition-all duration-200 ${
            isActive
              ? "text-white scale-110"
              : "text-slate-500 group-hover:text-slate-200"
          }`}
        />

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
              className="truncate overflow-hidden whitespace-nowrap"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    </NavTooltip>
  );
});
NavItem.displayName = "NavItem";

// ─── SECTION LABEL ───────────────────────────────────────────────────────────
const SectionLabel = memo(({ label, isCollapsed }) => (
  <AnimatePresence initial={false}>
    {!isCollapsed ? (
      <motion.p
        key="label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="px-3 pt-5 pb-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-slate-600 select-none"
      >
        {label}
      </motion.p>
    ) : (
      <div className="pt-3 pb-1 flex justify-center">
        <span className="w-4 h-px bg-white/10 rounded-full block" />
      </div>
    )}
  </AnimatePresence>
));
SectionLabel.displayName = "SectionLabel";

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function StudentSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, activeHostelData } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("student-sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("student-sidebar-collapsed", String(next));
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
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? "S";
  const userName = user?.email?.split("@")[0] ?? "Resident";
  const hostelName = activeHostelData?.hostelName;

  return (
    <>
      {/* ── Mobile Backdrop ───────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
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
        style={{
          background:
            "linear-gradient(170deg, #0a0f1a 0%, #091410 50%, #0b1a12 100%)",
        }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col text-slate-300 h-screen md:static border-r border-white/[0.05] overflow-hidden shrink-0`}
      >


        {/* ── Collapse Toggle ──────────────────────────────────────────────── */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex absolute -right-3.5 top-[72px] z-50 w-7 h-7 bg-emerald-600 hover:bg-emerald-500 rounded-full items-center justify-center text-white border-[3px] border-[#0a0f1a] transition-all duration-200 shadow-xl shadow-emerald-600/40"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={12} strokeWidth={3} />
          ) : (
            <PanelLeftClose size={12} strokeWidth={3} />
          )}
        </button>

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div
          className={`flex h-[68px] shrink-0 items-center relative z-10 border-b border-white/[0.05] px-4 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/40">
              <GraduationCap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <h1 className="text-[15px] font-black text-white tracking-tight leading-none">
                    HostelHub
                  </h1>
                  <span className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-[0.22em] mt-0.5 flex items-center gap-1">
                    <Zap size={8} />
                    Resident Portal
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Hostel Badge ─────────────────────────────────────────────────── */}
        {hostelName && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 pt-4 pb-2 relative z-10"
          >
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.07] rounded-xl">
              <Home size={13} className="text-emerald-400/70 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-0.5">
                  Your Hostel
                </p>
                <p className="text-[12px] font-bold text-slate-200 truncate">
                  {hostelName}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 px-2.5 py-2 scrollbar-hide">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <SectionLabel label={group.label} isCollapsed={isCollapsed} />
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.name}>
                      <NavItem
                        item={item}
                        isActive={isActive}
                        isCollapsed={isCollapsed}
                        onClick={onClose}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Bottom: Profile + Logout ──────────────────────────────────────── */}
        <div className="relative z-10 border-t border-white/[0.05] px-2.5 py-3 space-y-1">
          {/* User row */}
          <NavTooltip label={userName} show={isCollapsed}>
            <div
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[13px] font-black shrink-0 shadow-md shadow-emerald-500/30">
                {userInitial}
              </div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.16 }}
                    className="flex-1 min-w-0 overflow-hidden"
                  >
                    <p className="text-[12px] font-bold text-white truncate">
                      {userName}
                    </p>
                    <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                      Verified Resident
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </NavTooltip>

          {/* Logout */}
          <NavTooltip label="Sign Out" show={isCollapsed}>
            <button
              onClick={handleLogout}
              className={`
                group flex items-center gap-3 w-full rounded-xl px-3 py-2.5
                text-[11px] font-bold uppercase tracking-widest
                text-slate-500 hover:bg-rose-500/10 hover:text-rose-400
                transition-all duration-200
                ${isCollapsed ? "justify-center" : ""}
              `}
            >
              <LogOut
                size={16}
                strokeWidth={2}
                className="shrink-0 group-hover:translate-x-0.5 transition-transform duration-200"
              />
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </NavTooltip>
        </div>
      </motion.div>
    </>
  );
}
