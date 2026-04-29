"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  Mail,
  Lock,
  User,
  Phone,
  Hotel,
  Check
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";

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
  address: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms"
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];
const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-emerald-600"];

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState("student");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);

  const router = useRouter();
  const { user, refreshUser, loading: authLoading } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      hostelName: "",
      address: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const password = watch("password");

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

  const onSubmit = async (data) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        role: role,
        phone: data.phone,
        hostelName: data.hostelName,
        address: data.address
      });

      if (response.data.success) {
        await refreshUser();
        toast.success("Account created successfully! Welcome to HostelHub.");
        // Navigation handled by auth check in Layout/Context or here
        router.replace(role === "admin" ? "/admin/hostels" : "/student/select-hostel");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(err.response?.data?.error || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Identity Services callback
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
        await refreshUser();
        toast.success("Signed in with Google.");
        router.replace(role === "admin" ? "/admin/hostels" : "/student/dashboard");
      } else if (response.data.needsRole) {
        setGoogleUser({ uid, email, displayName: name, photoURL });
        setIsRoleModalOpen(true);
      }
    } catch (error) {
      console.error("Google Auth Error:", error);
      toast.error("Google Sign-In failed.");
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
      if (window.google?.accounts?.oauth2) {
        window.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: handleGoogleCredential,
        });
      }
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
                  className="space-y-0"
                />
              </div>
            </div>
          </div>

          {role === "admin" && (
            <>
              <SaaSInput
                label="Hostel Name"
                id="hostelName"
                placeholder="Elite Campus Hostel"
                register={register("hostelName")}
                error={errors.hostelName}
                icon={Hotel}
              />
              <SaaSInput
                label="Hostel Address"
                id="address"
                placeholder="123 Street, City"
                register={register("address")}
                error={errors.address}
                icon={Hotel}
              />
            </>
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
                      className={`flex-1 rounded-full transition-all duration-500 ${i < passwordStrength ? strengthColors[passwordStrength] : "bg-[#E2E8F0]"
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
            Create Account
            {/* <ArrowRight size={18} /> */}
          </SaaSButton>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E2E8F0]"></div>
          </div>
          <span className="relative px-4 bg-white text-[12px] font-medium text-[#94A3B8] tracking-widest uppercase">
            or signup with
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
