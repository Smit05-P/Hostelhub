"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";

const AuthContext = createContext(null);

// Configure Global Axios Interceptor for persistence
if (typeof window !== "undefined") {
  axios.interceptors.request.use(async (config) => {
    // Note: Cookies handle server-side, but frontend can still pass header for explicit context
    const hostelId = sessionStorage.getItem("hostel-id");
    if (hostelId) config.headers["x-hostel-id"] = hostelId;
    return config;
  }, (error) => {
    return Promise.reject(error);
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  
  // Initialize from sessionStorage to prevent UI flickering/empty states on refresh
  const [activeHostelId, setActiveHostelId] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("hostel-id") || null;
    }
    return null;
  });

  const [activeHostelData, setActiveHostelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hostelStatus, setHostelStatus] = useState("NO_HOSTEL");
  const router = useRouter();

  /**
   * Re-verify session with the server
   */
  const refreshUser = useCallback(async () => {
    try {
      console.log("[AUTH] Fetching session...");
      const { data } = await axios.get(`/api/auth/session?t=${Date.now()}`);
      
      if (data.authenticated && data.user) {
        console.log("[AUTH] Session authenticated:", { 
          role: data.user.role, 
          hostelId: data.user.hostelId,
          hostelStatus: data.user.hostelStatus 
        });
        
        setUser(data.user);
        setUserData(data.user);
        setRole(data.user.role);
        
        const sessionHostelId = data.user.hostelId;
        const storedHostelId = typeof window !== "undefined" ? sessionStorage.getItem("hostel-id") : null;
        
        const finalHostelId = sessionHostelId || storedHostelId || null;
        setActiveHostelId(finalHostelId);
        setActiveHostelData(data.user.hostelData || null);
        
        if (data.user.role === 'student') {
          const rawStatus = data.user.hostelStatus || (data.user.hostelId ? 'Approved' : 'No Hostel');
          // Normalize to uppercase and replace spaces/hyphens with underscores for reliable enum matching
          const status = rawStatus.toUpperCase().replace(/[\s-]/g, '_');
          console.log("[AUTH] Student status resolved to:", status);
          setHostelStatus(status);
          setHasPendingRequest(status === 'PENDING');
        } else {
          setHostelStatus(data.user.hostelId ? 'APPROVED' : 'NO_HOSTEL');
        }
        
        if (data.user.hostelId) {
          sessionStorage.setItem("hostel-id", data.user.hostelId);
        }

        // Return user data so callers (e.g. login page) can redirect immediately
        // without waiting for React state to propagate
        return data.user;
      } else {
        console.log("[AUTH] Not authenticated, clearing session");
        setUser(null);
        setUserData(null);
        setRole(null);
        setActiveHostelId(null);
        setActiveHostelData(null);
        setHostelStatus("No Hostel");
        setHasPendingRequest(false);
        sessionStorage.removeItem("hostel-id");
        return null;
      }
    } catch (error) {
      console.error("[AUTH] Session validation failed:", error.message);
      setUser(null);
      setUserData(null);
      setRole(null);
      setActiveHostelId(null);
      setActiveHostelData(null);
      setHostelStatus("No Hostel");
      setHasPendingRequest(false);
      sessionStorage.removeItem("hostel-id");
      return null;
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Background polling for residents without approved status
   */
  useEffect(() => {
    // Only poll if student and not approved
    if (role === 'student' && hostelStatus !== 'APPROVED') {
      const interval = setInterval(() => {
        console.log("[AUTH] Background status refresh...");
        refreshUser();
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [role, hostelStatus, refreshUser]);

  const switchHostel = useCallback(async (hostelId) => {
    setActiveHostelId(hostelId);
    sessionStorage.setItem("hostel-id", hostelId);
    
    try {
      // Fetch fresh hostel data
      const { data } = await axios.get(`/api/hostels/${hostelId}`);
      setActiveHostelData(data);
      router.push("/admin/dashboard");
    } catch (e) {
      console.error("Auth: Error switching hostel", e);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await axios.delete('/api/auth/session');
      setUser(null);
      setRole(null);
      sessionStorage.removeItem("hostel-id");
      router.push("/login");
    } catch (e) {
      console.error("Auth: Logout failed", e);
    }
  }, [router]);

  const refreshStudentHostel = useCallback(async (hostelId) => {
    setActiveHostelId(hostelId);
    if (hostelId) {
      setHostelStatus("Approved");
      setHasPendingRequest(false);
      sessionStorage.setItem("hostel-id", hostelId);
      try {
        const { data } = await axios.get(`/api/hostels/${hostelId}`);
        setActiveHostelData(data);
      } catch (e) {}
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, userData, role, activeHostelId, activeHostelData,
      isHostelSelected: !!activeHostelId, 
      hasPendingRequest, hostelStatus,
      switchHostel, refreshStudentHostel, refreshUser,
      loading, isInitialized, logout
    }}>
      {/* 
        We only render children once the session state is fully initialized.
        The Navigation Oracle in ProtectedRoute will then take control.
      */}
      {isInitialized ? children : (
        <div className="min-h-screen flex items-center justify-center bg-slate-50" suppressHydrationWarning>
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
