"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    setGeneralError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate password reset.");
      }

      // We just transition to the sent layout without showing a toast success model
      setIsSent(true);
    } catch (error: any) {
      setGeneralError(error.message || "Failed to request password reset.");
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
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Reset your password</h2>
          <p className="text-xs text-zinc-500 font-semibold mt-1">We will email you instructions to reset your password.</p>
        </div>

        <GlowCard className="border border-zinc-200/50 shadow-none" glowColor="rgba(59, 130, 246, 0.05)">
          <div className="p-8">
            {isSent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-lg">Email sent!</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                     Check your inbox. If an account matches that email address, you'll receive a password reset link shortly.
                  </p>
                </div>
                <button
                  onClick={() => setIsSent(false)}
                  className="text-xs font-bold text-indigo-650 hover:underline pt-2"
                >
                  Resend reset email
                </button>
              </div>
            ) : (
              <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit(onSubmit)}>
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

                <ShimmerButton 
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full mt-2 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2"
                  shimmerColor="#3B82F6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </ShimmerButton>
              </form>
            )}
          </div>
        </GlowCard>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-500 font-semibold mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
