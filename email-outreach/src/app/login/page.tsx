"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/feedback";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const verifiedParam = searchParams.get("verified");

  useEffect(() => {
    if (verifiedParam === "true") {
      setGeneralSuccess("Email verified successfully! You can now sign in.");
    }
  }, [verifiedParam]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setGeneralError("");
    setGeneralSuccess("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid credentials");
      }
      
      // Force refresh router state and redirect immediately
      router.push(callbackUrl);
      router.refresh();
    } catch (error: any) {
      setGeneralError(error.message || "Failed to sign in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to home
      </Link>

      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <img src="/logo/primeinbox-logo.png" alt="PrimeInbox Logo" className="h-9 w-auto group-hover:scale-105 transition-all" />
          </Link>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-zinc-500 font-semibold mt-1">Welcome back! Please enter your details.</p>
        </div>

        <GlowCard className="border border-zinc-200/50 shadow-none" glowColor="rgba(59, 130, 246, 0.05)">
          <div className="p-8">
            <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit(onSubmit)}>
              {generalSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100/50 text-center animate-in fade-in duration-200">
                  {generalSuccess}
                </div>
              )}
              {generalError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-100 text-center animate-in fade-in duration-200">
                  {generalError}
                </div>
              )}
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold text-zinc-500">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="name@company.com" 
                    {...register("email")}
                    className="h-11 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                  />
                </div>
                {errors.email && <p className="text-[11px] font-bold text-red-500 mt-0.5">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold text-zinc-500">Password</label>
                  <Link href="/forgot-password" className="text-[11px] font-bold text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    placeholder="••••••••" 
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-zinc-350 accent-indigo-650 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-zinc-500 font-semibold cursor-pointer select-none">
                  Remember Me
                </label>
              </div>

              <ShimmerButton 
                type="submit"
                disabled={isLoading}
                className="h-11 w-full mt-2 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2"
                shimmerColor="#3B82F6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </ShimmerButton>
            </form>
          </div>
        </GlowCard>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-500 font-semibold mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-650 mx-auto" />
          <p className="text-sm font-semibold text-zinc-650">Loading sign in...</p>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}
