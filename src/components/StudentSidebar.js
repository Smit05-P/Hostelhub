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
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// ─── NAV STRUCTURE (Grouped) ────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Core Systems",
    items: [
      { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Resident Identity",
    items: [
      { name: "Profile", href: "/student/profile", icon: UserIcon },
      { name: "Visitors", href: "/student/visitors", icon: Users },
    ],
  },
  {
    label: "Financial Ledger",
    items: [
      { name: "Payments", href: "/student/payments", icon: CreditCard },
    ],
  },
  {
    label: "Support Node",
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
          px-4 py-2 rounded-xl
          bg-slate-900 border border-white/10
          text-[9px] font-black text-white uppercase tracking-[0.2em]
          whitespace-nowrap shadow-2xl
          opacity-0 -translate-x-1
          group-hover/tip:opacity-100 group-hover/tip:translate-x-0
          transition-all duration-300
          top-1/2 -translate-y-1/2
        "
      >
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
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
          relative group flex items-center gap-4 rounded-2xl
          text-[10px] font-black uppercase tracking-[0.2em]
          transition-all duration-500 w-full mb-1
          ${isCollapsed ? "justify-center p-4" : "px-5 py-3.5"}
          ${
            isActive
              ? "bg-white/10 text-white shadow-2xl shadow-black/20 border border-white/5"
              : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
          }
        `}
      >
        {isActive && (
           <motion.div 
             layoutId="activeNav"
             className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent rounded-2xl -z-10"
           />
        )}
        
        {isActive && !isCollapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.8)]" />
        )}

        <Icon
          size={18}
          strokeWidth={isActive ? 2.5 : 2}
          className={`shrink-0 transition-all duration-500 ${
            isActive
              ? "text-indigo-400 scale-110 rotate-3"
              : "text-slate-600 group-hover:text-slate-300"
          }`}
        />

        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className={`truncate overflow-hidden whitespace-nowrap italic ${isActive ? "text-white font-black" : ""}`}
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
        className="px-5 pt-8 pb-3 text-[8px] font-black uppercase tracking-[0.4em] text-slate-700 select-none italic"
      >
        {label}
      </motion.p>
    ) : (
      <div className="pt-6 pb-2 flex justify-center">
        <span className="w-6 h-px bg-white/5 rounded-full block" />
      </div>
    )}
  </AnimatePresence>
));
SectionLabel.displayName = "SectionLabel";

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function StudentSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, logout, activeHostelData } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("student-sidebar-collapsed");
    if (saved !== null) setIsCollapsed(saved === "true");

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enforce collapsed state on tablets (768-1024)
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const effectiveIsCollapsed = isTablet || isCollapsed;

  const toggleCollapse = () => {
    if (isTablet) return; // Prevent expanding on tablet
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("student-sidebar-collapsed", String(next));
      return next;
    });
  };

  if (!mounted) return <div className="fixed inset-y-0 left-0 z-50 flex flex-col bg-[#05070a] w-20 md:w-64 border-r border-white/5" />;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? "S";
  const userName = (userData?.name || user?.email?.split("@")[0]) ?? "Resident";
  const hostelName = activeHostelData?.hostelName;

  return (
    <>
      {/* ── Mobile Backdrop ───────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md transition-opacity duration-500 lg:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <motion.div
        animate={{ 
          width: effectiveIsCollapsed ? 100 : 280,
          x: isOpen || (windowWidth >= 768) ? 0 : -320 
        }}
        initial={false}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-[#05070a] text-slate-300 h-screen lg:static border-r border-white/5 overflow-hidden shrink-0 shadow-2xl"
      >
        {/* Background Noise/Texture */}
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        
        {/* ── Collapse Toggle ──────────────────────────────────────────────── */}
        {!isTablet && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex absolute -right-3.5 top-24 z-50 w-7 h-7 bg-indigo-600 hover:bg-indigo-500 rounded-full items-center justify-center text-white border-[4px] border-[#05070a] transition-all duration-300 shadow-xl shadow-indigo-600/20 active:scale-90"
          >
            {isCollapsed ? <PanelLeftOpen size={10} strokeWidth={4} /> : <PanelLeftClose size={10} strokeWidth={4} />}
          </button>
        )}

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div className={`flex h-[88px] shrink-0 items-center relative z-10 px-6 ${effectiveIsCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/20 rotate-3 transition-transform">
              <GraduationCap size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <AnimatePresence mode="wait">
              {!effectiveIsCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <h1 className="text-lg font-black text-white tracking-tighter leading-none italic uppercase">
                    HostelHub
                  </h1>
                  <span className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5 italic">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                    RESIDENT NODE
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onClose} className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* ── Hostel Badge ─────────────────────────────────────────────────── */}
        {hostelName && !effectiveIsCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-2 pb-4">
            <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-[1.8rem] shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 shadow-2xl">
                 <Home size={16} className="text-indigo-400/70" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.3em] mb-1 italic">Security Node</p>
                <p className="text-[11px] font-black text-slate-200 truncate uppercase tracking-tight">{hostelName}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 px-4 py-2 scrollbar-hide">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <SectionLabel label={group.label} isCollapsed={effectiveIsCollapsed} />
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.name}>
                      <NavItem item={item} isActive={isActive} isCollapsed={effectiveIsCollapsed} onClick={onClose} />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Bottom Section ─────────────────────────────────────────────── */}
        <div className="relative z-10 border-t border-white/5 p-4 space-y-2">
          {/* User Row */}
          <NavTooltip label={userName} show={effectiveIsCollapsed}>
            <div className={`flex items-center gap-4 p-4 rounded-[1.8rem] bg-white/[0.02] border border-white/5 ${effectiveIsCollapsed ? "justify-center" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-white text-[13px] font-black shrink-0 shadow-2xl overflow-hidden relative group/avatar">
                {userData?.profileImage ? (
                  <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" />
                ) : (
                  <span className="italic">{userInitial}</span>
                )}
                <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
              </div>
              {!effectiveIsCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-white truncate italic uppercase tracking-tight">{userName}</p>
                  <p className="text-[8px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1 italic">Resident Node</p>
                </div>
              )}
            </div>
          </NavTooltip>

          {/* Logout Protocol */}
          <NavTooltip label="Terminate Session" show={effectiveIsCollapsed}>
            <button
              onClick={handleLogout}
              className={`group flex items-center gap-4 w-full rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 ${effectiveIsCollapsed ? "justify-center" : ""}`}
            >
              <LogOut size={18} strokeWidth={2.5} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
              {!effectiveIsCollapsed && <span className="italic">Terminate Session</span>}
            </button>
          </NavTooltip>
        </div>
      </motion.div>
    </>
  );
}
