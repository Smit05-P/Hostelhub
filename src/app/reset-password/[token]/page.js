"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Lock, ArrowRight, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// SaaS Components
import SaaSAuthLayout from "@/components/auth/SaaSAuthLayout";
import SaaSInput from "@/components/auth/SaaSInput";
import SaaSButton from "@/components/auth/SaaSButton";
import ForceLightMode from "@/components/ForceLightMode";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const token = params?.token; // Extract token from URL matches

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    if (isLoading) return;
    
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/reset-password", {
        token: token,
        password: data.password,
      });

      if (response.data) {
        toast.success("Password reset successful!");
        router.replace("/login");
      }
    } catch (err) {
      console.error("Reset Password Error:", err);
      const message = err.response?.data?.error || "Failed to reset password. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SaaSAuthLayout>
      <ForceLightMode />
      <div className="space-y-6">
        <div>
          <h2 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
            Reset Password
          </h2>
          <p className="text-sm font-medium text-[#64748B] mt-1.5">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <SaaSInput 
            label="New Password"
            id="password"
            type="password"
            placeholder="Enter new password"
            register={register("password")}
            error={errors.password}
            icon={Lock}
            showPasswordToggle={true}
          />
          <SaaSInput 
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            register={register("confirmPassword")}
            error={errors.confirmPassword}
            icon={Lock}
            showPasswordToggle={true}
          />

          <SaaSButton 
            type="submit" 
            isLoading={isLoading} 
            className="mt-2"
          >
            Reset Password <ArrowRight size={18} />
          </SaaSButton>
        </form>

        <p className="text-center text-sm font-medium text-[#64748B]">
          Remembered your password?{" "}
          <Link 
            href="/login" 
            className="text-[#4F46E5] font-bold hover:underline decoration-2 underline-offset-4"
          >
            Back to login
          </Link>
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9] opacity-80">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
            <Shield size={12} className="text-[#10B981]" />
            Secure Reset
          </div>
        </div>
      </div>
    </SaaSAuthLayout>
  );
}
