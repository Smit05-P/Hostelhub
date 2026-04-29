"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, Bed, CreditCard, Bell, LogOut, X, 
  ChevronLeft, ChevronRight, User as UserIcon, Shield,
  ArrowLeftRight, MessageSquare, UserCheck, BarChart3,
  Cpu, GraduationCap, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// ─── NAV STRUCTURE (Grouped) ────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Command Center",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Entity Management",
    items: [
      { name: "Students",      href: "/admin/students",      icon: GraduationCap },
      { name: "Rooms",         href: "/admin/rooms",         icon: Bed },
      { name: "Join Requests", href: "/admin/join-requests", icon: UserCheck },
      { name: "Allocation",    href: "/admin/allocation",    icon: ArrowLeftRight },
    ],
  },
  {
    label: "Fiscal & Service Hub",
    items: [
      { name: "Fees", href: "/admin/fees", icon: CreditCard },
      { name: "Complaints", href: "/admin/complaints", icon: MessageSquare },
      { name: "Visitors", href: "/admin/visitors", icon: UserCheck },
    ],
  },
  {
    label: "Intelligence Output",
    items: [
      { name: "Reports", href: "/admin/reports", icon: BarChart3 },
      { name: "Notices", href: "/admin/notices", icon: Bell },
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
             layoutId="activeNavAdmin"
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
export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, logout, activeHostelData, isHostelSelected } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved !== null) setIsCollapsed(saved === "true");

    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); // Initialize on mount
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
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  if (!mounted) return <div className="fixed inset-y-0 left-0 z-50 flex flex-col bg-[#05070a] w-20 md:w-64 border-r border-white/5" />;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? "A";
  const userName = (userData?.name || user?.email?.split("@")[0]) ?? "Administrator";

  return (
    <>
      {/* Mobile Backdrop */}
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
        
        {/* Background Glow Orbs */}
        <div className="absolute top-0 left-0 w-full h-80 pointer-events-none overflow-hidden">
          <div className="absolute top-[-60px] left-[-40px] w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute top-[40px] right-[-20px] w-48 h-48 bg-indigo-500/8 blur-[80px] rounded-full" />
        </div>

        {/* Collapse Toggle */}
        {!isTablet && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex absolute -right-3.5 top-24 z-50 w-7 h-7 bg-blue-600 hover:bg-blue-500 rounded-full items-center justify-center text-white border-[4px] border-[#05070a] transition-all duration-300 shadow-xl shadow-blue-600/20 active:scale-90"
          >
            {isCollapsed ? <PanelLeftOpen size={10} strokeWidth={4} /> : <PanelLeftClose size={10} strokeWidth={4} />}
          </button>
        )}

        {/* Logo */}
        <div className={`flex h-[88px] shrink-0 items-center relative z-10 px-6 ${effectiveIsCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-2xl shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform">
              <Shield size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <AnimatePresence mode="wait">
              {!effectiveIsCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <h1 className="text-lg font-black text-white tracking-tighter leading-none italic uppercase">HostelHub</h1>
                  <span className="text-[8px] text-blue-400 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5 italic">
                    <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                    Core Engine
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Hostel Switcher */}
        {isHostelSelected && !effectiveIsCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-2 pb-4 relative z-10">
            <Link
              href="/admin/hostels"
              className="group flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-[1.8rem] hover:bg-white/[0.04] hover:border-blue-500/30 transition-all duration-500 shadow-inner"
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.3em] mb-1 italic">Facility Node</span>
                <span className="text-[12px] font-black text-slate-200 truncate group-hover:text-white transition-colors uppercase tracking-tight">
                  {activeHostelData?.hostelName || "Primary Hostel"}
                </span>
              </div>
              <ArrowLeftRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0 group-hover:rotate-180 duration-700" />
            </Link>
          </motion.div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-4 py-2">
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

        {/* Bottom Section */}
        <div className="relative z-10 border-t border-white/5 p-4 space-y-2">
          {/* Admin Identity */}
          <NavTooltip label={userName} show={effectiveIsCollapsed}>
            <div className={`flex items-center gap-4 p-4 rounded-[1.8rem] bg-white/[0.02] border border-white/5 ${effectiveIsCollapsed ? "justify-center" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-white text-[13px] font-black shrink-0 shadow-2xl overflow-hidden relative group/avatar">
                {userData?.profileImage ? (
                  <div className="w-full h-full relative">
                    <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" />
                  </div>
                ) : (
                  <span className="italic">{userInitial}</span>
                )}
                <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
              </div>
              {!effectiveIsCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-white truncate italic uppercase tracking-tight">{userName}</p>
                  <p className="text-[8px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1 italic">Systems Admin</p>
                </div>
              )}
            </div>
          </NavTooltip>

          {/* Logout Protocol */}
          <NavTooltip label="Deauthorize Node" show={effectiveIsCollapsed}>
            <button
              onClick={handleLogout}
              className={`group flex items-center gap-4 w-full rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 ${effectiveIsCollapsed ? "justify-center" : ""}`}
            >
              <LogOut size={18} strokeWidth={2.5} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
              {!effectiveIsCollapsed && <span className="italic">Deauthorize Node</span>}
            </button>
          </NavTooltip>
        </div>
      </motion.div>
    </>
  );
}
