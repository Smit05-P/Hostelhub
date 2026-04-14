"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";

const AuthContext = createContext(null);

// Configure Global Axios Interceptor for Tab Isolation
if (typeof window !== "undefined") {
  axios.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("auth-token");
    const hostelId = sessionStorage.getItem("hostel-id");
    
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
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
  const [activeHostelId, setActiveHostelId] = useState(null);
  const [activeHostelData, setActiveHostelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hostelStatus, setHostelStatus] = useState("NO_HOSTEL");
  
  const pathname = usePathname();
  const router = useRouter();

  const fetchUserData = async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setUserData(null);
      setRole(null);
      setActiveHostelId(null);
      setActiveHostelData(null);
      setHasPendingRequest(false);
      setHostelStatus("NO_HOSTEL");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("auth-token");
        sessionStorage.removeItem("user-role");
        sessionStorage.removeItem("hostel-id");
      }
      return;
    }

    let data = null;
    let userRole = null;
    let pendingJoin = false;
    let effectiveHostelId = null;

    // Use sessionStorage as immediate fallback
    const tabRole = typeof window !== "undefined" ? sessionStorage.getItem("user-role") : null;
    const rawTabHostelId = typeof window !== "undefined" ? sessionStorage.getItem("hostel-id") : null;
    const tabHostelId = (rawTabHostelId === "null" || rawTabHostelId === "undefined" || rawTabHostelId === "[object Object]") ? null : rawTabHostelId;

    try {
      // 1. Try "users" collection
      const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (userSnap.exists()) {
        data = userSnap.data();
        userRole = data.role;
      } else {
        // 2. Fallback to "hostels" collection (Admins)
        const adminSnap = await getDoc(doc(db, "hostels", firebaseUser.uid));
        if (adminSnap.exists()) {
          data = adminSnap.data();
          userRole = "admin";
        }
      }

      if (data && userRole === "student" && !data.hostelId) {
        try {
          const { getStudentJoinRequest } = await import("@/lib/firestore");
          const req = await getStudentJoinRequest({ userId: firebaseUser.uid });
          if (req?.status === "pending") pendingJoin = true;
          else if (req?.status === "approved" && req.hostelId) data.hostelId = req.hostelId;
        } catch (e) { console.warn("Could not fetch join request status"); }
      }
    } catch (error) {
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.warn("Auth: Firestore is offline. Using session fallback.");
      } else {
        console.error("Auth: Error fetching user data:", error);
      }
    }

    // Update state with whatever we have (Firestore data or session fallback)
    setUser(firebaseUser);
    setUserData(data);
    const effectiveRole = tabRole || userRole;
    
    // Improved Admin hostelId resolution
    if (!tabHostelId && effectiveRole === "admin") {
      try {
        const { getAllHostels } = await import("@/lib/firestore");
        const hostels = await getAllHostels(firebaseUser.uid);
        if (hostels && hostels.length > 0) {
          effectiveHostelId = hostels[0].id; // Default to first managed hostel
        }
      } catch (e) {
        console.error("Auth: Error fetching admin hostels:", e);
      }
    }

    effectiveHostelId = tabHostelId || effectiveHostelId || (effectiveRole === "student" ? data?.hostelId : (effectiveRole === "admin" ? firebaseUser.uid : null));
    
    setRole(effectiveRole);
    setActiveHostelId(effectiveHostelId);
    setHasPendingRequest(pendingJoin);
    
    if (effectiveRole === "student") {
      if (effectiveHostelId) setHostelStatus("APPROVED");
      else if (pendingJoin) setHostelStatus("PENDING");
      else setHostelStatus("NO_HOSTEL");
    }
    
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth-token", firebaseUser.uid);
      if (effectiveRole) sessionStorage.setItem("user-role", effectiveRole);
      
      const isBadId = (id) => !id || id === "null" || id === "undefined" || id === "[object Object]";
      if (!isBadId(effectiveHostelId)) {
        sessionStorage.setItem("hostel-id", effectiveHostelId);
      }
    }
    
    if (effectiveHostelId && !activeHostelData) {
      try {
        const hSnap = await getDoc(doc(db, "hostels", effectiveHostelId));
        if (hSnap.exists()) setActiveHostelData({ id: hSnap.id, ...hSnap.data() });
      } catch (e) { /* ignore offline hostel data fetch */ }
    }
  };

  const refreshUser = async () => {
    if (auth.currentUser) {
      setLoading(true);
      await fetchUserData(auth.currentUser);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      await fetchUserData(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isHostelSelected = !!activeHostelId;

  const switchHostel = async (hostelId) => {
    setActiveHostelId(hostelId);
    if (typeof window !== "undefined") sessionStorage.setItem("hostel-id", hostelId);
    const hSnap = await getDoc(doc(db, "hostels", hostelId));
    if (hSnap.exists()) setActiveHostelData({ id: hSnap.id, ...hSnap.data() });
    window.location.href = "/admin/dashboard"; 
  };

  const logout = async () => {
    await signOut(auth);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth-token");
      sessionStorage.removeItem("user-role");
      sessionStorage.removeItem("hostel-id");
    }
    setUser(null);
    setUserData(null);
    setRole(null);
    setActiveHostelId(null);
    setActiveHostelData(null);
    setHostelStatus("NO_HOSTEL");
  };

  const refreshStudentHostel = async (hostelId) => {
    setActiveHostelId(hostelId);
    if (hostelId) {
      setHostelStatus("APPROVED");
      setHasPendingRequest(false);
    }
    if (typeof window !== "undefined" && hostelId) sessionStorage.setItem("hostel-id", hostelId);
    
    if (hostelId) {
      const hSnap = await getDoc(doc(db, "hostels", hostelId));
      if (hSnap.exists()) setActiveHostelData({ id: hSnap.id, ...hSnap.data() });
    }
  };

  return (
    <AuthContext.Provider value={{
      user, userData, role, activeHostelId, activeHostelData,
      isHostelSelected, hasPendingRequest, hostelStatus,
      switchHostel, refreshStudentHostel, refreshUser,
      loading, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
