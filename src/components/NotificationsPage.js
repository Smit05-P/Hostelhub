"use client";

import { useNotification } from "@/contexts/NotificationContext";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Bell, Check, X, Megaphone, Receipt, Wallet, 
  Wrench, Bed, UserIcon, Trash2, CheckCircle2,
  Sparkles, Zap, Layers, Cpu, ShieldCheck,
  Calendar, Clock, Inbox, Filter, activity as Activity
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { SkeletonHero, SkeletonCard, Shimmer } from "@/components/ui/Skeleton";

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllRead, clearAll, deleteNotification, isLoading } = useNotification();
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'
  const router = useRouter();

  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-12 max-w-5xl mx-auto w-full pb-20">
        <SkeletonHero />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="flex items-center gap-8 px-6 border-b border-slate-100">
              <Shimmer className="w-24 h-14" />
              <Shimmer className="w-24 h-14" />
              <Shimmer className="w-24 h-14" />
           </div>
           <div className="p-6 space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border-b border-slate-50 last:border-0">
                   <Shimmer className="w-10 h-10 rounded-xl" />
                   <div className="flex-1 space-y-2">
                      <Shimmer className="w-1/2 h-4 rounded" />
                      <Shimmer className="w-3/4 h-3 rounded" />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  const getIcon = (type) => {
    switch(type) {
      case "visitor_request": return <UserIcon size={18} className="text-indigo-600" />;
      case "visitor_approved": return <Check size={18} className="text-emerald-600" />;
      case "visitor_rejected": return <X size={18} className="text-rose-600" />;
      case "fee_due": return <Wallet size={18} className="text-amber-600" />;
      case "fee_paid": return <Receipt size={18} className="text-indigo-600" />;
      case "complaint_raised":
      case "complaint_resolved": return <Wrench size={18} className="text-amber-600" />;
      case "room_allocated": return <Bed size={18} className="text-indigo-600" />;
      case "announcement": return <Megaphone size={18} className="text-purple-600" />;
      default: return <Bell size={18} className="text-slate-400" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto w-full pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-3 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">
             <Bell size={12} /> Communication Hub
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Stay updated with real-time alerts, property updates, and residential activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
           <button 
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
           >
              <CheckCircle2 size={16} className="text-emerald-500" /> Mark All Read
           </button>
           <button 
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all shadow-sm"
           >
              <Trash2 size={16} /> Clear All
           </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-8 px-6 border-b border-slate-100">
          {[
            { id: "all", label: "All Activity" },
            { id: "unread", label: "Unread" },
            { id: "read", label: "Archived" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-5 text-xs font-bold transition-all relative ${
                filter === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              {filter === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" 
                />
              )}
            </button>
          ))}
        </div>

        {/* List Content */}
        <div className="divide-y divide-slate-50">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4 border border-slate-100 shadow-inner">
                  <Inbox size={32} />
               </div>
               <h3 className="text-lg font-bold text-slate-900">Your inbox is clear</h3>
               <p className="text-sm font-medium text-slate-400 mt-1 max-w-xs mx-auto">
                 No {filter !== 'all' ? filter : ''} notifications found. We&apos;ll alert you when there&apos;s new activity.
               </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredNotifications.map((notif) => (
                <div 
                  key={notif._id}
                  onClick={() => {
                    if (!notif.isRead) markAsRead(notif._id);
                    if (notif.actionUrl) router.push(notif.actionUrl);
                  }}
                  className={`group flex items-start gap-4 p-6 hover:bg-slate-50 transition-all cursor-pointer relative ${
                    notif.isRead ? 'opacity-60' : 'bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                    notif.isRead ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className={`text-sm tracking-tight truncate ${notif.isRead ? 'font-medium text-slate-500' : 'font-bold text-slate-900'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-4 pt-1">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <CalendarIcon size={12} className="text-slate-300" />
                          {format(new Date(notif.createdAt), "MMM d")}
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <ClockIcon size={12} className="text-slate-300" />
                          {format(new Date(notif.createdAt), "h:mm a")}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                        className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                        title="Delete notification"
                     >
                        <Trash2 size={16} />
                     </button>
                     {!notif.isRead && (
                       <button 
                          onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                          className="p-2 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded-lg transition-all"
                          title="Mark as read"
                       >
                          <Check size={16} />
                       </button>
                     )}
                  </div>

                  {!notif.isRead && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-100">
               <ShieldCheck size={20} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alert Security</p>
               <p className="text-xs font-semibold text-slate-700">All notifications are end-to-end encrypted.</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 border border-emerald-100">
               <ActivityIcon size={20} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Sync</p>
               <p className="text-xs font-semibold text-slate-700">Background synchronization is active.</p>
            </div>
         </div>
      </div>
    </div>
  );
}

// Minimal missing icons
const CalendarIcon = ({ size, className }) => <Calendar size={size} className={className} />;
const ClockIcon = ({ size, className }) => <Clock size={size} className={className} />;
const ActivityIcon = ({ size, className }) => <Cpu size={size} className={className} />;
