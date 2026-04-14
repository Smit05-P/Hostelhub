"use client";

import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { setDoc, doc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import { 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  ArrowRight, 
  Hotel,
  ShieldCheck,
  Check
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { findStudentByEmail } from "@/lib/firestore";

// SaaS Components
import SaaSAuthLayout from "@/components/auth/SaaSAuthLayout";
import SaaSInput from "@/components/auth/SaaSInput";
import SaaSButton from "@/components/auth/SaaSButton";
import SaaSRoleToggle from "@/components/auth/SaaSRoleToggle";

import RoleSelectionModal from "@/components/auth/RoleSelectionModal";
import ForceLightMode from "@/components/ForceLightMode";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid 10-digit number"),
  hostelName: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState("student");
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 to 4
  
  // Google Onboarding State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      hostelName: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const password = watch("password");

  // Pre-fill from Google user if available
  useEffect(() => {
    if (user && !isLoading) {
      if (user.displayName) setValue("name", user.displayName);
      if (user.email) setValue("email", user.email);
    }
  }, [user, setValue]);

  // Simple Password Strength Logic
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length > 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-emerald-600"];

  const onSubmit = async (data) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: data.name });

      // ─── ACCOUNT LINKING / MIGRATION ────────────────────────────
      // Check if there is an existing record for this email (e.g. added by Admin)
      const existingProfile = role === "student" ? await findStudentByEmail(data.email) : null;
      
      const userData = {
        uid: user.uid,
        name: data.name,
        email: data.email,
        role: role,
        phoneNumber: `+91${data.phone}`,
        created_at: serverTimestamp(),
        // Inherit from existing profile if found
        hostelId: existingProfile?.hostelId || null,
        assignedRoomId: existingProfile?.assignedRoomId || existingProfile?.room_id || null,
        enrollmentId: existingProfile?.enrollmentId || existingProfile?.enrollment_id || "",
        status: existingProfile?.status || (role === "student" ? "Active" : null),
        joiningDate: existingProfile?.joiningDate || existingProfile?.joined_date || existingProfile?.joinedDate || null,
        profileImage: existingProfile?.profileImage || null
      };

      if (role === "student") {
        userData.hostelStatus = existingProfile?.hostelId ? "APPROVED" : "NO_HOSTEL";
      }

      if (role === "admin" && data.hostelName) {
        userData.hostelName = data.hostelName;
      }

      // Create new profile with Auth UID
      await setDoc(doc(db, "users", user.uid), userData);

      // Clean up old record if it was a different document
      if (existingProfile && existingProfile.id !== user.uid) {
         try {
            await deleteDoc(doc(db, "users", existingProfile.id));
         } catch (e) {
            console.error("Migration cleanup failed:", e);
         }
      }
      
      sessionStorage.setItem("auth-token", user.uid);
      sessionStorage.setItem("user-role", role);
      
      // Sync AuthContext with new Firestore data
      await refreshUser();
      
      toast.success("Account created successfully! Welcome to HostelHub.");
      router.replace(role === "admin" ? "/admin/hostels" : "/student/select-hostel");
    } catch (err) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("This email is already registered.");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        sessionStorage.setItem("auth-token", result.user.uid);
        sessionStorage.setItem("user-role", userData.role);
        toast.success("Signed in with Google.");
        router.replace(userData.role === "admin" ? "/admin/hostels" : "/student/dashboard");
      } else {
        setGoogleUser(result.user);
        setIsRoleModalOpen(true);
      }
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Google Auth Error:", error);
        toast.error("Google Sign-In failed.");
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

      if (!response.ok) throw new Error("Failed to create profile");

      sessionStorage.setItem("auth-token", googleUser.uid);
      sessionStorage.setItem("user-role", selectedRole);
      
      // Sync AuthContext with new Firestore data
      await refreshUser();
      
      toast.success("Account created with Google!");
      setIsRoleModalOpen(false);
      router.replace(selectedRole === "admin" ? "/admin/hostels" : "/student/select-hostel");
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
        
        {/* Step Indicator */}
        <div className="flex justify-center">
          <div className="inline-flex items-center px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-[#4F46E5] uppercase tracking-widest">
            Step 1 of 2
          </div>
        </div>

        <div>
          <h2 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight text-center">
            Create Your Account
          </h2>
          <p className="text-sm font-medium text-[#64748B] mt-1.5 text-center">
            Set up in less than 2 minutes
          </p>
        </div>

        {/* Role Selector */}
        <SaaSRoleToggle role={role} setRole={setRole} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SaaSInput 
            label="Full Name"
            id="name"
            placeholder="Your full name"
            register={register("name")}
            error={errors.name}
            icon={User}
          />

          <SaaSInput 
            label="Email Address"
            id="email"
            type="email"
            placeholder="you@example.com"
            register={register("email")}
            error={errors.email}
            icon={Mail}
          />

          {/* Mobile Number with prefix */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0F172A] tracking-tight">Mobile Number</label>
            <div className="flex gap-2">
              <div className="w-16 h-[52px] bg-[#F8FAFC] border-1.5 border-[#E2E8F0] rounded-xl flex items-center justify-center text-sm font-semibold text-[#64748B]">
                +91
              </div>
              <div className="flex-1">
                <SaaSInput 
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  register={register("phone")}
                  error={errors.phone}
                  icon={Phone}
                  className="space-y-0" // Remove label space
                />
              </div>
            </div>
          </div>

          {role === "admin" && (
            <SaaSInput 
              label="Hostel Name"
              id="hostelName"
              placeholder="Elite Campus Hostel"
              register={register("hostelName")}
              error={errors.hostelName}
              icon={Hotel}
            />
          )}

          <div className="space-y-3">
            <SaaSInput 
              label="Password"
              id="password"
              type="password"
              placeholder="Create a password"
              register={register("password")}
              error={errors.password}
              icon={Lock}
              showPasswordToggle={true}
            />
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-1.5 px-1 animate-fade-in">
                <div className="flex justify-between items-center text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <span>Strength</span>
                  <span className={strengthColors[passwordStrength].replace("bg-", "text-")}>
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
                <div className="flex gap-1 h-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full transition-all duration-500 ${
                        i < passwordStrength ? strengthColors[passwordStrength] : "bg-[#E2E8F0]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <SaaSInput 
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            register={register("confirmPassword")}
            error={errors.confirmPassword}
            icon={Lock}
            showPasswordToggle={true}
          />

          {/* Terms Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input 
                  type="checkbox" 
                  {...register("agreeToTerms")}
                  className="peer shrink-0 appearance-none w-5 h-5 border-2 border-[#E2E8F0] rounded-[6px] bg-white checked:bg-[#4F46E5] checked:border-[#4F46E5] hover:border-[#CBD5E1] transition-all duration-200 shadow-sm"
                />
                <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
              </div>
              <span className="text-xs font-medium text-[#64748B] leading-relaxed select-none">
                I agree to the{" "}
                <Link href="#" className="text-[#4F46E5] font-bold hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="#" className="text-[#4F46E5] font-bold hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="text-[11px] font-medium text-red-500 mt-2 pl-8 flex items-center gap-1.5 animate-slide-up">
                <span className="w-1 h-1 rounded-full bg-red-500" />
                {errors.agreeToTerms.message}
              </p>
            )}
          </div>

          <SaaSButton 
            type="submit" 
            isLoading={isLoading} 
            className="mt-4"
          >
            Create Account <ArrowRight size={18} />
          </SaaSButton>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0]"></div>
          </div>
          <span className="relative px-4 bg-white text-[12px] font-medium text-[#94A3B8] tracking-widest uppercase">
            or signup with
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

        <p className="text-center text-sm font-medium text-[#64748B] pt-2">
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="text-[#4F46E5] font-bold hover:underline decoration-2 underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>

      <RoleSelectionModal 
        isOpen={isRoleModalOpen}
        onSelect={handleRoleSelect}
        isLoading={isGoogleLoading}
      />
    </SaaSAuthLayout>
  );
}
