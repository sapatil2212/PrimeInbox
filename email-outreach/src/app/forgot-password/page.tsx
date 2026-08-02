"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/feedback";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { cn } from "@/lib/utils";
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  X,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

// Password validation regex rules
const minLength = 8;
const hasUpper = /[A-Z]/;
const hasLower = /[a-z]/;
const hasNumber = /[0-9]/;
const hasSpecial = /[^A-Za-z0-9]/;

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(minLength, `Password must be at least ${minLength} characters`)
      .regex(hasUpper, "Must contain at least one uppercase letter")
      .regex(hasLower, "Must contain at least one lowercase letter")
      .regex(hasNumber, "Must contain at least one number")
      .regex(hasSpecial, "Must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [modalError, setModalError] = useState("");

  // Modal Step Flow: 0 = Closed, 1 = OTP Step, 2 = Password Step, 3 = Success Modal
  const [modalStep, setModalStep] = useState<0 | 1 | 2 | 3>(0);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // 6-Digit OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Timer State
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form for Email Request
  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // Form for Resetting Password in Step 2 Modal
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    watch: watchReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordVal = watchReset("password", "");

  // Password Strength Logic
  const criteria = {
    length: passwordVal.length >= minLength,
    upper: hasUpper.test(passwordVal),
    lower: hasLower.test(passwordVal),
    number: hasNumber.test(passwordVal),
    special: hasSpecial.test(passwordVal),
  };
  const strengthCount = Object.values(criteria).filter(Boolean).length;
  const getStrengthInfo = () => {
    if (!passwordVal) return { label: "Enter password", color: "bg-zinc-200" };
    if (strengthCount <= 2) return { label: "Weak", color: "bg-red-500" };
    if (strengthCount <= 4) return { label: "Medium", color: "bg-amber-500" };
    return { label: "Strong", color: "bg-emerald-500" };
  };
  const strengthInfo = getStrengthInfo();

  // Handle 60s Resend Timer
  useEffect(() => {
    let interval: any;
    if (modalStep === 1 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [modalStep, resendTimer]);

  // Handle OTP digit input changes
  const handleOtpChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "");
    if (!sanitized) {
      const newOtp = [...otpDigits];
      newOtp[index] = "";
      setOtpDigits(newOtp);
      return;
    }

    // Handle single digit vs paste
    if (sanitized.length === 1) {
      const newOtp = [...otpDigits];
      newOtp[index] = sanitized;
      setOtpDigits(newOtp);
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (sanitized.length === 6) {
      const pasted = sanitized.split("").slice(0, 6);
      setOtpDigits(pasted);
      inputRefs.current[5]?.focus();
    }
  };

  // Handle Backspace on OTP boxes
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 0 -> Step 1: Submit Email to Send 6-Digit OTP
  const onSendOtpSubmit = async (data: ForgotPasswordValues) => {
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
        throw new Error(result.error || "Failed to send reset code.");
      }

      setSubmittedEmail(data.email);
      setOtpDigits(Array(6).fill(""));
      setModalError("");
      setResendTimer(60);
      setCanResend(false);
      setModalStep(1); // Open Step 1 Modal
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      setGeneralError(error.message || "Failed to request password reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (!canResend || !submittedEmail) return;
    setCanResend(false);
    setResendTimer(60);
    setModalError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success("New 6-digit code sent to your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code.");
      setCanResend(true);
    }
  };

  // Step 1 -> Step 2: Verify OTP 6-digits and proceed to password entry
  const handleVerifyOtpStep = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setModalError("Please enter all 6 digits of the verification code.");
      return;
    }
    setModalError("");
    setModalStep(2); // Proceed to Step 2: Set New Password
  };

  // Step 2 -> Step 3: Submit OTP + New Password to Reset
  const onResetPasswordSubmit = async (data: ResetPasswordValues) => {
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setModalError("Verification code error. Please go back and enter 6 digits.");
      setModalStep(1);
      return;
    }

    setIsResetting(true);
    setModalError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: submittedEmail,
          otp: fullOtp,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password.");
      }

      // Proceed to Step 3: Steady Success Tick Modal
      setModalStep(3);

      // Auto-redirect to login after 1.8 seconds
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 1800);
    } catch (error: any) {
      setModalError(error.message || "Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10 bg-zinc-50/50">
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
            <img
              src="/logo/primeinbox-logo.png"
              alt="PrimeInbox Logo"
              className="h-9 w-auto group-hover:scale-105 transition-all"
            />
          </Link>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Reset your password
          </h2>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Enter your email to receive a 6-digit password reset code.
          </p>
        </div>

        <GlowCard className="border border-zinc-200/60 shadow-xl shadow-zinc-200/50" glowColor="rgba(59, 130, 246, 0.05)">
          <div className="p-8">
            <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmitForgot(onSendOtpSubmit)}>
              {generalError && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200 text-center animate-in fade-in duration-200">
                  {generalError}
                </div>
              )}

              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold text-zinc-600">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    id="email"
                    placeholder="name@company.com"
                    {...registerForgot("email")}
                    className="h-11 pl-10 pr-4 w-full rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                  />
                </div>
                {forgotErrors.email && (
                  <p className="text-[11px] font-bold text-red-500 mt-0.5">
                    {forgotErrors.email.message}
                  </p>
                )}
              </div>

              <ShimmerButton
                type="submit"
                disabled={isLoading}
                className="h-11 w-full mt-2 rounded-xl text-sm font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2"
                shimmerColor="#3B82F6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    Sending 6-Digit Code...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Send Reset Code
                  </>
                )}
              </ShimmerButton>
            </form>
          </div>
        </GlowCard>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-500 font-semibold mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-indigo-600 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* ─── STEP 1 MODAL: 6-DIGIT OTP ENTRY ONLY ────────────────────────────── */}
      {modalStep === 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-zinc-900">Step 1 of 2: Verification Code</h3>
              </div>
              <button
                onClick={() => setModalStep(0)}
                className="p-1 rounded-lg hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyOtpStep} className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-xs text-zinc-500 font-medium">
                  We've emailed a 6-digit verification code to:
                </p>
                <p className="text-xs font-extrabold text-indigo-600 mt-0.5">{submittedEmail}</p>
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200 text-center animate-in fade-in duration-200">
                  {modalError}
                </div>
              )}

              {/* 6 ANIMATED OTP BOXES */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <div className="flex items-center justify-between gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={cn(
                        "w-11 h-13 text-center text-xl font-extrabold rounded-xl border transition-all outline-none font-mono",
                        digit
                          ? "border-indigo-600 bg-indigo-50/40 text-indigo-700 ring-2 ring-indigo-500/20 scale-105"
                          : "border-zinc-200 bg-white text-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Next Step Button */}
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
              >
                Verify Code &amp; Continue <ArrowRight className="w-4 h-4" />
              </button>

              {/* Resend Code Footer */}
              <div className="text-center border-t border-zinc-100 pt-3">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Resend 6-digit code
                  </button>
                ) : (
                  <p className="text-[11px] font-semibold text-zinc-400">
                    Resend code in <strong className="text-zinc-700">{resendTimer}s</strong>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── STEP 2 MODAL: SET NEW PASSWORD ─────────────────────────────────── */}
      {modalStep === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalStep(1)}
                  className="p-1 rounded-lg hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700 transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="font-extrabold text-sm text-zinc-900">Step 2 of 2: Set New Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalStep(0)}
                className="p-1 rounded-lg hover:bg-zinc-200/60 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReset(onResetPasswordSubmit)} className="p-6 space-y-4">
              <p className="text-xs text-zinc-500 font-medium text-center mb-1">
                Enter your new password below for <strong className="text-zinc-900">{submittedEmail}</strong>
              </p>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-200 text-center animate-in fade-in duration-200">
                  {modalError}
                </div>
              )}

              {/* New Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-600">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...registerReset("password")}
                    className="h-10 pl-10 pr-10 w-full rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetErrors.password && (
                  <p className="text-[10px] font-bold text-red-500">{resetErrors.password.message}</p>
                )}

                {/* Password Strength Indicator Bar */}
                {passwordVal && (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-zinc-400">Strength</span>
                      <span className={cn("text-xs font-bold", strengthInfo.color.replace("bg-", "text-"))}>
                        {strengthInfo.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={cn("h-full transition-all duration-300 rounded-full", strengthInfo.color)}
                        style={{ width: `${(strengthCount / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-zinc-600">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...registerReset("confirmPassword")}
                    className="h-10 pl-10 pr-10 w-full rounded-xl border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="text-[10px] font-bold text-red-500">{resetErrors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={isResetting}
                className="w-full h-11 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── STEP 3 MODAL: CLEAN STEADY SUCCESS TICK MODAL (NO BOUNCE) ─────────── */}
      {modalStep === 3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 w-full max-w-sm p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            {/* Steady Checkmark Circle (Bouncing effect removed) */}
            <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                Password Reset Successful!
              </h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Your password has been updated. Redirecting you to sign in...
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
