"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// SaaS Components
import SaaSAuthLayout from "@/components/auth/SaaSAuthLayout";
import SaaSInput from "@/components/auth/SaaSInput";
import SaaSButton from "@/components/auth/SaaSButton";
import SaaSRoleToggle from "@/components/auth/SaaSRoleToggle";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import RoleSelectionModal from "@/components/auth/RoleSelectionModal";
import ForceLightMode from "@/components/ForceLightMode";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState("student");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  const router = useRouter();
  const { user, role: currentRole, hostelStatus, loading: authLoading, refreshUser } = useAuth();

  // Helper: derive the correct destination from fresh session data
  const getRedirectPath = (userData) => {
    if (!userData) return "/login";
    if (userData.role === "admin") return "/admin/hostels";
    if (userData.role === "student") {
      const status = (userData.hostelStatus || "NO_HOSTEL").toUpperCase();
      const paths = {
        APPROVED: "/student/dashboard",
        PENDING: "/student/pending",
        REJECTED: "/student/select-hostel",
        NO_HOSTEL: "/student/select-hostel",
      };
      return paths[status] || "/student/select-hostel";
    }
    return "/";
  };

  // Guard: redirect already-authenticated users away from login page
  useEffect(() => {
    if (!authLoading && user && currentRole) {
      const path = getRedirectPath({ role: currentRole, hostelStatus });
      console.log("[LOGIN] Already authenticated, redirecting to", path);
      router.replace(path);
    }
  // Only run when auth state is resolved
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/login", {
        email: data.email,
        password: data.password,
        role: role
      });

      if (response.data.success) {
        console.log("[LOGIN] Login successful, fetching fresh session...");
        // refreshUser now returns the live user data — redirect from it directly
        // so we don't race against React's async state propagation
        const freshUser = await refreshUser();
        toast.success("Successfully signed in!");
        const path = getRedirectPath(freshUser);
        console.log("[LOGIN] Redirecting to", path);
        router.replace(path);
      }
    } catch (err) {
      console.error("[LOGIN] Login Error:", err);
      const message = err.response?.data?.error || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (tokenResponse) => {
    if (tokenResponse.error) {
       console.error("Google Auth Error:", tokenResponse.error);
       toast.error("Google Sign-In was cancelled or failed.");
       return;
    }
    
    setIsGoogleLoading(true);
    try {
      // Fetch user profile using the access token
      const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      
      const { sub: uid, email, name, picture: photoURL } = userInfoResponse.data;

      const response = await axios.post("/api/auth/google", {
        uid, email, name, photoURL,
        role: role,
      });

      if (response.data.success) {
        const freshUser = await refreshUser();
        toast.success("Signed in with Google.");
        const path = getRedirectPath(freshUser);
        router.replace(path);
      } else if (response.data.needsRole) {
        setGoogleUser({ uid, email, displayName: name, photoURL });
        setIsRoleModalOpen(true);
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      toast.error("Google Sign-In failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  }, [role, refreshUser, router]);

  // Load Google Identity Services script
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in environment variables.");
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.googleTokenClient = window.google?.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: handleGoogleCredential,
      });
    };
    document.head.appendChild(script);
    return () => { 
      if (document.head.contains(script)) document.head.removeChild(script); 
    };
  }, [handleGoogleCredential]);

  const handleGoogleSignIn = () => {
    if (window.googleTokenClient) {
      window.googleTokenClient.requestAccessToken();
    } else {
      toast.error("Google Sign-In is not initialized. Please configure your Client ID.");
    }
  };

  const handleRoleSelect = async (selectedRole) => {
    if (!googleUser) return;
    setIsGoogleLoading(true);
    try {
      await axios.post("/api/auth/google", {
        uid: googleUser.uid,
        email: googleUser.email,
        name: googleUser.displayName,
        photoURL: googleUser.photoURL,
        role: selectedRole,
      });

      const freshUser = await refreshUser();
      toast.success(`Account created as ${selectedRole}!`);
      setIsRoleModalOpen(false);
      const path = getRedirectPath(freshUser);
      router.replace(path);
    } catch (err) {
      console.error("Google Onboarding Error:", err);
      toast.error("Failed to complete profile.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SaaSAuthLayout>
      <ForceLightMode />
      <div className="space-y-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
            Welcome Back
          </h2>
          <p className="text-sm font-medium text-[#64748B] mt-1.5">
            Sign in to continue to your dashboard
          </p>
        </div>

        <SaaSRoleToggle role={role} setRole={setRole} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <SaaSInput 
            label="Email Address"
            id="email"
            type="email"
            placeholder="you@example.com"
            register={register("email")}
            error={errors.email}
            icon={Mail}
          />

          <div className="space-y-1.5">
            <SaaSInput 
              label="Password"
              id="password"
              type="password"
              placeholder="Enter your password"
              register={register("password")}
              error={errors.password}
              icon={Lock}
              showPasswordToggle={true}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-xs font-semibold text-[#4F46E5] hover:text-[#3730A3] transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <SaaSButton 
            type="submit" 
            isLoading={isLoading} 
            className="mt-2"
          >
            Sign In <ArrowRight size={18} />
          </SaaSButton>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0]"></div>
          </div>
          <span className="relative px-4 bg-white text-[12px] font-medium text-[#94A3B8] tracking-widest uppercase">
            or
          </span>
        </div>

        <SaaSButton 
          variant="white" 
          onClick={handleGoogleSignIn}
          isLoading={isGoogleLoading}
          icon={() => (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
        >
          Continue with Google
        </SaaSButton>

        <p className="text-center text-sm font-medium text-[#64748B]">
          Don't have an account?{" "}
          <Link 
            href="/register" 
            className="text-[#4F46E5] font-bold hover:underline decoration-2 underline-offset-4"
          >
            Create one
          </Link>
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9] opacity-80">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            <Shield size={12} className="text-[#10B981]" />
            Secure Login
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            🏨 2000+ Hostels
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            ⭐ 4.9 Rated
          </div>
        </div>
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotPasswordOpen} 
        onClose={() => setIsForgotPasswordOpen(false)} 
      />

      <RoleSelectionModal 
        isOpen={isRoleModalOpen}
        onSelect={handleRoleSelect}
        isLoading={isGoogleLoading}
      />
    </SaaSAuthLayout>
  );
}
