"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const router = useRouter();
  const { user, role, activeHostelId } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const prevCountRef = useRef(0);

  const addToast = useCallback((notif) => {
    const toastData = { ...notif, toastId: Math.random().toString(36).slice(2, 11) };
    setToasts(prev => [...prev, toastData]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== toastData.toastId));
    }, 5000);
  }, []);

  const removeToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  const fetchNotifications = useCallback(async (signal) => {
    if (!user || !activeHostelId || !role) {
      setIsLoading(false);
      return [];
    }
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/notifications?hostelId=${activeHostelId}&userId=${(user?._id || user?.id || user?.uid)}&role=${role}`, { signal });
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      return data;
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Failed to fetch notifications:", err);
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, role, activeHostelId]);

  const fetchUnreadCount = useCallback(async (signal, isInitial = false) => {
    if (!user || !activeHostelId || !role) return;
    try {
      const res = await axios.get(`/api/notifications/unread-count?hostelId=${activeHostelId}&userId=${(user?._id || user?.id || user?.uid)}&role=${role}`, { signal });
      const newCount = res.data.count;

      if (isInitial) {
        setUnreadCount(newCount);
        prevCountRef.current = newCount;
        await fetchNotifications(signal);
      } else if (newCount > prevCountRef.current) {
        // A new notification arrived!
        const newData = await fetchNotifications(signal);
        
        // Find newest unread to toast
        const newUnread = newData.find(n => !n.isRead);
        if (newUnread) addToast(newUnread);

        setUnreadCount(newCount);
        prevCountRef.current = newCount;
      } else if (newCount < prevCountRef.current) {
         // Some notifications were read elsewhere
         setUnreadCount(newCount);
         prevCountRef.current = newCount;
         await fetchNotifications(signal);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Failed to fetch notification count:", err);
      }
    }
  }, [user, role, activeHostelId, fetchNotifications, addToast]);

  useEffect(() => {
    const controller = new AbortController();
    const refreshNotifications = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount(controller.signal, false);
      }
    };

    if (user && activeHostelId && role) {
      queueMicrotask(() => { void fetchUnreadCount(controller.signal, true); });
      const intervalId = setInterval(refreshNotifications, 10000); // Poll every 10 seconds for real-time feel
      window.addEventListener("focus", refreshNotifications);
      document.addEventListener("visibilitychange", refreshNotifications);
      return () => {
        clearInterval(intervalId);
        window.removeEventListener("focus", refreshNotifications);
        document.removeEventListener("visibilitychange", refreshNotifications);
        controller.abort();
      };
    }

    queueMicrotask(() => {
      setNotifications([]);
      setUnreadCount(0);
      prevCountRef.current = 0;
    });
    return () => controller.abort();
  }, [user, activeHostelId, role, fetchUnreadCount]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        prevCountRef.current = newCount;
        return newCount;
      });
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', { hostelId: activeHostelId, userId: (user?._id || user?.id || user?.uid), role });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      prevCountRef.current = 0;
    } catch (err) {
      console.error("markAllRead error:", err);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete(`/api/notifications?hostelId=${activeHostelId}&userId=${(user?._id || user?.id || user?.uid)}&role=${role}`);
      setNotifications([]);
      setUnreadCount(0);
      prevCountRef.current = 0;
    } catch (err) {
      console.error("clearAll error:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllRead,
      clearAll,
      isLoading
    }}>
      {children}

      {toasts.length > 0 && typeof window !== "undefined" && !["/login", "/register", "/admin/login", "/student/select-hostel", "/student/pending"].some(p => window.location.pathname.startsWith(p) || window.location.pathname === p) && (
        <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3 pointer-events-none" suppressHydrationWarning>
          {toasts.slice(-3).map(toast => (
            <div
              key={toast.toastId}
              className="w-80 bg-white shadow-2xl rounded-2xl p-4 border border-slate-100 flex gap-4 animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-auto relative overflow-hidden group"
            >
              <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 animate-[shrink_5s_linear_forwards]" />
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <span className="text-xl">🔔</span>
              </div>
              <div className="flex-1 pr-6 cursor-pointer" onClick={() => { if (toast.actionUrl) router.push(toast.actionUrl); removeToast(toast.toastId); if (!toast.isRead) markAsRead(toast._id); }}>
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
