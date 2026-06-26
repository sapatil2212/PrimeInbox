"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";

// Password validation regex rules
const minLength = 8;
const hasUpper = /[A-Z]/;
const hasLower = /[a-z]/;
const hasNumber = /[0-9]/;
const hasSpecial = /[^A-Za-z0-9]/;

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(minLength, `Password must be at least ${minLength} characters`)
    .regex(hasUpper, "Must contain at least one uppercase letter")
    .regex(hasLower, "Must contain at least one lowercase letter")
    .regex(hasNumber, "Must contain at least one number")
    .regex(hasSpecial, "Must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    if (!token) {
      setGeneralError("Invalid or missing password reset token.");
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watch("password", "");

  const criteria = {
    length: passwordVal.length >= minLength,
    upper: hasUpper.test(passwordVal),
    lower: hasLower.test(passwordVal),
    number: hasNumber.test(passwordVal),
    special: hasSpecial.test(passwordVal),
  };

  const strengthCount = Object.values(criteria).filter(Boolean).length;
  
  const getStrengthLabel = () => {
    if (!passwordVal) return { label: "Enter password", color: "bg-zinc-200" };
    if (strengthCount <= 2) return { label: "Weak", color: "bg-red-500" };
    if (strengthCount <= 4) return { label: "Medium", color: "bg-amber-500" };
    return { label: "Strong", color: "bg-emerald-500" };
  };

  const strengthInfo = getStrengthLabel();

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      setGeneralError("Token is missing. Cannot reset password.");
      return;
    }
    
    setIsLoading(true);
    setGeneralError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password.");
      }

      setIsSuccess(true);
      
      // Redirect after brief delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      setGeneralError(error.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
      <Link 
        href="/login" 
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
      </Link>

      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <img src="/logo/primeinbox-logo.png" alt="PrimeInbox Logo" className="h-9 w-auto group-hover:scale-105 transition-all" />
          </Link>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Choose new password</h2>
          <p className="text-xs text-zinc-500 font-semibold mt-1">Set a new, strong password for your account.</p>
        </div>

        <GlowCard className="border border-zinc-200/50 shadow-none" glowColor="rgba(59, 130, 246, 0.05)">
          <div className="p-8">
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-lg">Password reset successful!</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Your password has been changed. We are redirecting you to the sign in page now...
                  </p>
                </div>
                <Link href="/login" className="inline-block text-xs font-bold text-indigo-650 hover:underline pt-2">
                  Go to login immediately
                </Link>
              </div>
            ) : (
              <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit(onSubmit)}>
                {generalError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-100 text-center animate-in fade-in duration-200">
                    {generalError}
                  </div>
                )}
                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-zinc-500">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      id="password" 
                      placeholder="Min. 8 characters" 
                      {...register("password")}
                      className="h-11 pl-10 pr-10 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] font-bold text-red-500 mt-0.5">{errors.password.message}</p>}

                  {/* Password Strength Meter & Real-time Indicator */}
                  {passwordVal && (
                    <div className="mt-2 space-y-2 border border-zinc-100 rounded-xl p-3 bg-zinc-50/50 text-[11px] text-zinc-500">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Password Strength:</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] text-white ${strengthInfo.color}`}>
                          {strengthInfo.label}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${strengthInfo.color} transition-all duration-300`} 
                          style={{ width: `${(strengthCount / 5) * 100}%` }}
                        />
                      </div>
                      {/* Requirements checklist */}
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mt-1 font-semibold">
                        <span className="flex items-center gap-1.5">
                          {criteria.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-zinc-350" />}
                          8+ characters
                        </span>
                        <span className="flex items-center gap-1.5">
                          {criteria.upper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-zinc-350" />}
                          Uppercase letter
                        </span>
                        <span className="flex items-center gap-1.5">
                          {criteria.lower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-zinc-350" />}
                          Lowercase letter
                        </span>
                        <span className="flex items-center gap-1.5">
                          {criteria.number ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-zinc-350" />}
                          Number (0-9)
                        </span>
                        <span className="flex items-center gap-1.5 col-span-2">
                          {criteria.special ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-zinc-350" />}
                          Special character (!@#$ etc)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-bold text-zinc-500">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      id="confirmPassword" 
                      placeholder="••••••••" 
                      {...register("confirmPassword")}
                      className="h-11 pl-10 pr-10 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] font-bold text-red-500 mt-0.5">{errors.confirmPassword.message}</p>}
                </div>

                <ShimmerButton 
                  type="submit"
                  disabled={isLoading || !token}
                  className="h-11 w-full mt-2 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2"
                  shimmerColor="#3B82F6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </ShimmerButton>
              </form>
            )}
          </div>
        </GlowCard>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-650 mx-auto" />
          <p className="text-sm font-semibold text-zinc-650">Loading page...</p>
        </div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
