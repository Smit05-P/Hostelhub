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

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={markAllRead}
                className="text-[11px] font-bold text-slate-500 hover:text-blue-700 transition-colors"
              >
                Mark all read
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Bell size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-700">You're all caught up!</h4>
                <p className="text-xs text-slate-500 mt-1">No new notifications right now.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.slice(0, 20).map((notif) => (
                  <div 
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-4 p-4 border-b border-slate-50 cursor-pointer transition-colors ${
                      notif.isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/30 hover:bg-blue-50/50"
                    }`}
                  >
                    {!notif.isRead && (
                       <div className="w-2 h-2 rounded-full bg-blue-600 absolute left-2 mt-4" />
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-slate-100' : 'bg-white shadow-sm'}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm tracking-tight truncate ${notif.isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-800'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                        {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : "Just now"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center flex justify-between items-center">
            <button onClick={clearAll} className="p-1 text-slate-400 hover:text-rose-500 transition-colors" title="Clear All">
               <X size={14} />
            </button>
            <button 
              onClick={() => { setIsOpen(false); router.push(`/${role}/notifications`); }}
              className="text-xs font-bold text-blue-700 hover:text-blue-700 mx-auto w-full"
            >
              View all notifications &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
