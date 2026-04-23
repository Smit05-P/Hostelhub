"use client";

import { useNotification } from "@/contexts/NotificationContext";
import { useState, useRef, useEffect } from "react";
import { Bell, Check, X, Megaphone, Receipt, Wallet, Wrench, Bed, UserIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotification();
  const { role } = useAuth();
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case "visitor_request": return <UserIcon size={16} className="text-blue-500" />;
      case "visitor_approved": return <Check size={16} className="text-blue-600" />;
      case "visitor_rejected": return <X size={16} className="text-rose-500" />;
      case "fee_due": return <Wallet size={16} className="text-orange-500" />;
      case "fee_paid": return <Receipt size={16} className="text-blue-600" />;
      case "complaint_raised":
      case "complaint_resolved": return <Wrench size={16} className="text-yellow-500" />;
      case "room_allocated": return <Bed size={16} className="text-indigo-500" />;
      case "announcement": return <Megaphone size={16} className="text-purple-500" />;
      default: return <Bell size={16} className="text-slate-500" />;
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-400 hover:text-blue-700 hover:bg-blue-600/5 rounded-2xl transition-all group"
      >
        <Bell size={20} strokeWidth={2} className={unreadCount > 0 ? "animate-[wiggle_1s_ease-in-out_infinite]" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(244,63,94,0.4)] text-[9px] font-black leading-none text-white flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel — fixed full-width on mobile, anchored dropdown on desktop */}
      {isOpen && (
        <>
          {/* Mobile/Tablet: fullscreen overlay backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/10 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          <div className={`
            z-50 bg-white border border-slate-100 shadow-2xl overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
            rounded-2xl sm:rounded-3xl
            fixed left-3 right-3 top-[70px] sm:static sm:absolute sm:top-full sm:right-0 sm:left-auto sm:mt-3 sm:w-[360px] md:w-[380px]
          `}>
            
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-400 sm:hidden" />
                <h3 className="font-bold text-slate-800 tracking-tight text-sm sm:text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={markAllRead}
                  className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-blue-700 transition-colors whitespace-nowrap"
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors sm:hidden"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List — constrained height, scrollable */}
            <div className="max-h-[55vh] sm:max-h-[400px] overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                    <Bell size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">You're all caught up!</h4>
                  <p className="text-xs text-slate-500 mt-1">No new notifications right now.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-50">
                  {notifications.slice(0, 20).map((notif) => (
                    <div 
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors active:scale-[0.99] ${
                        notif.isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/40 hover:bg-blue-50/60"
                      }`}
                    >
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${notif.isRead ? 'bg-slate-100' : 'bg-white shadow-sm border border-slate-100'}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm leading-snug ${notif.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-800'}`}>
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1.5 block">
                          {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : "Just now"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button 
                onClick={clearAll} 
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" 
                title="Clear All"
              >
                <X size={14} />
              </button>
              <button 
                onClick={() => { setIsOpen(false); router.push(`/${role}/notifications`); }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex-1 text-center"
              >
                View all notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
