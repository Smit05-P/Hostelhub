"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, role, activeHostelId } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);
  
  const prevCountRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = useCallback(async (signal) => {
    if (!user || !activeHostelId || !role) return;
    try {
      const res = await axios.get(`/api/notifications?hostelId=${activeHostelId}&userId=${user.uid}&role=${role}`, { signal });
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      const unread = data.filter(n => !n.isRead).length;
      
      if (unread > prevCountRef.current) {
        const newUnread = data.find(n => !n.isRead);
        if (newUnread) addToast(newUnread);
      }
      
      setUnreadCount(unread);
      prevCountRef.current = unread;
    } catch(err) {
      if (!axios.isCancel(err)) {
        console.error("Failed to fetch notifications:", err);
      }
    }
  }, [user, role, activeHostelId]);

  const fetchUnreadCount = useCallback(async (signal) => {
    if (!user || !activeHostelId || !role) return;
    try {
      const res = await axios.get(`/api/notifications/unread-count?hostelId=${activeHostelId}&userId=${user.uid}&role=${role}`, { signal });
      const newCount = res.data.count;
      
      if (newCount > prevCountRef.current) {
        await fetchNotifications(signal);
      } else {
        setUnreadCount(newCount);
        prevCountRef.current = newCount;
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Failed to fetch notification count:", err);
      }
    }
  }, [user, role, activeHostelId, fetchNotifications]);

  useEffect(() => {
    const controller = new AbortController();
    
    if (user && activeHostelId && role) {
      fetchNotifications(controller.signal);
      const intervalId = setInterval(() => fetchUnreadCount(controller.signal), 30000); // 30 seconds
      return () => {
        clearInterval(intervalId);
        controller.abort();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      prevCountRef.current = 0;
      return () => controller.abort();
    }
  }, [user, activeHostelId, role, fetchNotifications, fetchUnreadCount]);

  const addToast = (notif) => {
    // Generate a unique ID for the toast to allow multiple
    const toastData = { ...notif, toastId: Math.random().toString(36).substr(2, 9) };
    setToasts(prev => [...prev, toastData]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== toastData.toastId));
    }, 5000);
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    } catch(err) {
      console.error("markAsRead error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', { hostelId: activeHostelId, userId: user.uid, role });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      prevCountRef.current = 0;
    } catch(err) {
      console.error("markAllRead error:", err);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete(`/api/notifications?hostelId=${activeHostelId}&userId=${user.uid}&role=${role}`);
      setNotifications([]);
      setUnreadCount(0);
      prevCountRef.current = 0;
    } catch(err) {
      console.error("clearAll error:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllRead,
      clearAll
    }}>
      {children}
      
      {/* Toast Render Logic */}
      {mounted && toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none" suppressHydrationWarning>
          {toasts.slice(-3).map(toast => (
            <div 
              key={toast.toastId} 
              className="w-80 bg-white shadow-2xl rounded-2xl p-4 border border-slate-100 flex gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto relative overflow-hidden group"
            >
              <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 animate-[shrink_5s_linear_forwards]" />
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <span className="text-xl">🔔</span>
              </div>
              <div className="flex-1 pr-6 cursor-pointer" onClick={() => { if(toast.actionUrl) window.location.href = toast.actionUrl; removeToast(toast.toastId); if(!toast.isRead) markAsRead(toast.id); }}>
                <h4 className="text-sm font-bold text-slate-800">{toast.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.toastId)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
