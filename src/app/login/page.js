"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Mail, Lock, ArrowRight, Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";

// SaaS Components
import SaaSAuthLayout from "@/components/auth/SaaSAuthLayout";
import SaaSInput from "@/components/auth/SaaSInput";
import SaaSButton from "@/components/auth/SaaSButton";
import SaaSRoleToggle from "@/components/auth/SaaSRoleToggle";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import ForceLightMode from "@/components/ForceLightMode";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid professional email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState("student");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const router = useRouter();
  const { user, role: currentRole, hostelStatus, loading: authLoading, refreshUser } = useAuth();

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

  useEffect(() => {
    if (!authLoading && user && currentRole) {
      const path = getRedirectPath({ role: currentRole, hostelStatus });
      router.replace(path);
    }
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
        const freshUser = await refreshUser();
        toast.success("Signed in successfully");
        const path = getRedirectPath(freshUser);
        router.replace(path);
      }
    } catch (err) {
      const message = err.response?.data?.error || "Login failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(async (tokenResponse) => {
    if (tokenResponse.error) return;
    setIsGoogleLoading(true);
    try {
      const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      const { sub: uid, email, name, picture: photoURL } = userInfoResponse.data;
      const response = await axios.post("/api/auth/google", { uid, email, name, photoURL, role: role });
      if (response.data.success) {
        const freshUser = await refreshUser();
        toast.success("Authenticated with Google");
        const path = getRedirectPath(freshUser);
        router.replace(path);
      }
    } catch (error) {
      toast.error("Google authentication failed");
    } finally {
      setIsGoogleLoading(false);
    }
  }, [role, refreshUser, router]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
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
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, [handleGoogleCredential]);

  const handleGoogleSignIn = () => {
    if (window.googleTokenClient) window.googleTokenClient.requestAccessToken();
    else toast.error("Google Auth unavailable");
  };

  return (
    <SaaSAuthLayout>
      <ForceLightMode />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-10"
      >
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-[32px] sm:text-[40px] font-black text-slate-900 tracking-tight leading-tight font-sora">
            Welcome Back
          </h1>
          <p className="text-[15px] sm:text-[17px] font-medium text-slate-500 font-dm">
            Sign in to access your dashboard.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SaaSRoleToggle role={role} setRole={setRole} />
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <motion.div variants={itemVariants}>
            <SaaSInput
              label="Professional Email"
              id="email"
              type="email"
              placeholder="name@organization.com"
              register={register("email")}
              error={errors.email}
              icon={Mail}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <SaaSInput
              label="Secure Password"
              id="password"
              type="password"
              placeholder="••••••••"
              register={register("password")}
              error={errors.password}
              icon={Lock}
              showPasswordToggle={true}
            />
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                className="text-[14px] font-bold text-[#4F46E5] hover:text-[#7C3AED] transition-colors flex items-center gap-2 group"
              >
                <span>Forgot password?</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <SaaSButton
              type="submit"
              isLoading={isLoading}
              loadingText="Authenticating..."
              className="mt-6 h-[64px] text-[17px] font-black rounded-full shadow-[0_20px_40px_rgba(79,70,229,0.2)]"
            >
              Sign In
              {/* <ArrowRight size={22} strokeWidth={2.5} /> */}
            </SaaSButton>
          </motion.div>
        </form>

        <motion.div variants={itemVariants} className="relative py-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center px-2">
            <div className="w-full border-t-2 border-slate-50 border-dashed"></div>
          </div>
          <span className="relative px-8 bg-white text-[12px] font-black text-slate-400 tracking-[0.25em] uppercase">
            OR CONTINUE WITH
          </span>
        </motion.div>

        <motion.div variants={itemVariants}>
          <SaaSButton
            variant="white"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            loadingText="Redirecting..."
            className="h-[64px] border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm rounded-full text-slate-700"
            icon={() => (
              <svg className="w-6 h-6 mr-1" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
          >
            Google Identity
          </SaaSButton>
        </motion.div>

        <motion.p variants={itemVariants} className="text-center text-[16px] font-medium text-slate-500 pt-6">
          New to HostelHub?{" "}
          <Link
            href="/register"
            className="text-[#4F46E5] font-black hover:text-[#7C3AED] transition-colors underline decoration-2 underline-offset-8 decoration-indigo-100 hover:decoration-[#4F46E5]"
          >
            Create an account
          </Link>
        </motion.p>
      </motion.div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </SaaSAuthLayout>
  );
}
