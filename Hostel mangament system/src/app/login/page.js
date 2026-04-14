"use client";

import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import { Mail, ShieldCheck, Lock, ArrowRight, Shield } from "lucide-react";
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
  
  // Google Onboarding State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  const router = useRouter();
  const { user, role: currentRole, activeHostelId, hostelStatus, loading: authLoading, refreshUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && currentRole) {
      if (currentRole === "admin") {
        router.replace("/admin/hostels");
      } else if (currentRole === "student") {
        if (hostelStatus === "APPROVED") router.replace("/student/dashboard");
        else if (hostelStatus === "PENDING") router.replace("/student/pending");
        else router.replace("/student/select-hostel");
      }
    }
  }, [user, currentRole, hostelStatus, authLoading, router]);

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
      // In a real app we might use data.rememberMe, but for now we follow the spec which didn't mention it.
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (!userDoc.exists() || !userDoc.data().role) {
        // Fallback for Admins who might be in 'hostels' collection
        const hostelDoc = await getDoc(doc(db, "hostels", userCredential.user.uid));
        if (hostelDoc.exists()) {
          const userRole = "admin";
          
          // Role Validation Check
          if (role !== "admin") {
            await auth.signOut();
            toast.error("This account is registered as Admin. Please select the correct role to login.");
            setIsLoading(false);
            return;
          }

          sessionStorage.setItem("auth-token", userCredential.user.uid);
          sessionStorage.setItem("user-role", userRole);
          toast.success("Authenticated as Administrator.");
          router.replace("/admin/hostels");
          return;
        }

        await auth.signOut();
        toast.error("Account not found. Please register first.");
        setIsLoading(false);
        return;
      }

      const userData = userDoc.data();
      const userRole = userData.role;
      const studentHostelId = userData.hostelId;

      // Role Validation Check
      if (userRole !== role) {
        await auth.signOut();
        const displayRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);
        toast.error(`This account is registered as ${displayRole}. Please select the correct role to login.`);
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem("auth-token", userCredential.user.uid);
      sessionStorage.setItem("user-role", userRole);
      
      if (userRole === "student" && studentHostelId) {
        sessionStorage.setItem("hostel-id", studentHostelId);
      }
      
      // Sync AuthContext with updated roles/data
      await refreshUser();
      
      toast.success("Successfully signed in! Redirecting...");
      
      if (userRole === "admin") {
        router.replace("/admin/hostels");
      } else {
        // Correct Status-aware redirection for students
        if (studentHostelId) {
          router.replace("/student/dashboard");
        } else {
          // Check for pending request if possible, or default to selection
          // AuthContext handles the deep check, but for immediate login:
          router.replace("/student/select-hostel");
        }
      }

    } catch (err) {
      console.error("Login Error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error("An error occurred during sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Check if user has a document
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Role Validation Check
        if (userData.role !== role) {
          await auth.signOut();
          const displayRole = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
          toast.error(`This account is registered as ${displayRole}. Please select the correct role to login.`);
          setIsGoogleLoading(false);
          return;
        }

        sessionStorage.setItem("auth-token", result.user.uid);
        sessionStorage.setItem("user-role", userData.role);
        
        // Sync AuthContext
        await refreshUser();
        
        toast.success("Signed in with Google.");
        if (userData.role === "admin") {
          router.replace("/admin/hostels");
        } else {
          if (userData.hostelId) router.replace("/student/dashboard");
          else router.replace("/student/select-hostel");
        }
      } else {
        // Fallback check for Admins in 'hostels' collection
        const hostelDoc = await getDoc(doc(db, "hostels", result.user.uid));
        if (hostelDoc.exists()) {
          if (role !== "admin") {
            await auth.signOut();
            toast.error("This account is registered as Admin. Please select the correct role to login.");
            setIsGoogleLoading(false);
            return;
          }
          sessionStorage.setItem("auth-token", result.user.uid);
          sessionStorage.setItem("user-role", "admin");
          
          // Sync AuthContext
          await refreshUser();
          
          toast.success("Signed in with Google as Admin.");
          router.replace("/admin/hostels");
          return;
        }

        // New Google User - Needs Role Selection
        setGoogleUser(result.user);
        setIsRoleModalOpen(true);
      }
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Google Sign-In popup was closed by user.");
      } else {
        console.error("Google Auth Error:", error);
        toast.error("Google Sign-In failed. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRoleSelect = async (selectedRole) => {
    if (!googleUser) return;
    setIsGoogleLoading(true);
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: googleUser.uid,
          email: googleUser.email,
          name: googleUser.displayName,
          photoURL: googleUser.photoURL,
          role: selectedRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create profile");

      sessionStorage.setItem("auth-token", googleUser.uid);
      sessionStorage.setItem("user-role", selectedRole);

      // Sync AuthContext
      await refreshUser();

      toast.success(`Account created as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}!`);
      setIsRoleModalOpen(false);
      
      router.replace(selectedRole === "admin" ? "/admin/hostels" : "/student/select-hostel");

    } catch (err) {
      console.error("Google Onboarding Error:", err);
      toast.error("Failed to complete profile. Please try again.");
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

        {/* Role Selector */}
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

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0]"></div>
          </div>
          <span className="relative px-4 bg-white text-[12px] font-medium text-[#94A3B8] tracking-widest uppercase">
            or
          </span>
        </div>

        {/* Google Sign In */}
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

        {/* Bottom Redirect */}
        <p className="text-center text-sm font-medium text-[#64748B]">
          Don't have an account?{" "}
          <Link 
            href="/register" 
            className="text-[#4F46E5] font-bold hover:underline decoration-2 underline-offset-4"
          >
            Create one
          </Link>
        </p>

        {/* Trust Row */}
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
