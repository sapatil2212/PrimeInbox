"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Mail, Lock, Key, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
  password: z.string().min(1, "Password is required"),
  securityKey: z.string().min(1, "Security key is required"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Password criteria rules
const minLength = 8;
const hasUpper = /[A-Z]/;
const hasLower = /[a-z]/;
const hasNumber = /[0-9]/;
const hasSpecial = /[^A-Za-z0-9]/;

// Password change schema
const changePasswordSchema = z.object({
  securityKey: z.string().min(1, "Security key is required"),
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

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function SuperAdminLoginPage() {
  const router = useRouter();
  
  // Login states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");

  // Modal / Password reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify" | "success">("request");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  
  // Stored details for step 2
  const [pendingPassword, setPendingPassword] = useState("");
  const [pendingSecurityKey, setPendingSecurityKey] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      securityKey: "",
      rememberMe: false,
    },
  });

  const {
    register: registerChange,
    handleSubmit: handleSubmitChange,
    watch: watchChange,
    reset: resetChangeForm,
    formState: { errors: changeErrors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      securityKey: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watchChange("password", "");

  const criteria = {
    length: passwordVal.length >= minLength,
    upper: hasUpper.test(passwordVal),
    lower: hasLower.test(passwordVal),
    number: hasNumber.test(passwordVal),
    special: hasSpecial.test(passwordVal),
  };

  const strengthCount = Object.values(criteria).filter(Boolean).length;
  
  const getStrengthLabel = () => {
    if (!passwordVal) return { label: "Enter password", color: "bg-zinc-250" };
    if (strengthCount <= 2) return { label: "Weak", color: "bg-red-500" };
    if (strengthCount <= 4) return { label: "Medium", color: "bg-amber-500" };
    return { label: "Strong", color: "bg-emerald-500" };
  };

  const strengthInfo = getStrengthLabel();

  // Login handler
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setGeneralError("");
    setGeneralSuccess("");
    try {
      const response = await fetch("/api/auth/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid credentials");
      }

      setGeneralSuccess("Logged in successfully! Redirecting...");
      router.push("/admin");
      router.refresh();
    } catch (error: any) {
      setGeneralError(error.message || "Failed to sign in as Super Admin.");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP request handler
  const onRequestOtp = async (data: ChangePasswordFormValues) => {
    setIsResetLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      const response = await fetch("/api/auth/superadmin/request-password-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "contact.primeinbox@gmail.com", // Super admin email
          securityKey: data.securityKey,
          newPassword: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to request password modification.");
      }

      setPendingPassword(data.password);
      setPendingSecurityKey(data.securityKey);
      setResetStep("verify");
      setResetSuccess(result.message || "OTP code sent to saptechnoeditors@gmail.com");
      
      setTimeout(() => {
        document.getElementById("otp-0")?.focus();
      }, 150);
    } catch (error: any) {
      setResetError(error.message || "Failed to request code.");
    } finally {
      setIsResetLoading(false);
    }
  };

  // OTP change confirmation handler
  const onConfirmPasswordChange = async () => {
    setIsResetLoading(true);
    setResetError("");
    setResetSuccess("");
    try {
      const otpCode = otpValues.join("");
      if (otpCode.length < 6) {
        throw new Error("Please enter all 6 digits of the OTP code.");
      }

      const response = await fetch("/api/auth/superadmin/confirm-password-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "contact.primeinbox@gmail.com",
          securityKey: pendingSecurityKey,
          newPassword: pendingPassword,
          token: otpCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Verification failed.");
      }

      setResetStep("success");
      setResetSuccess("Password reset successful!");
      
      // Reset variables
      setPendingPassword("");
      setPendingSecurityKey("");
      setOtpValues(Array(6).fill(""));
      resetChangeForm();
    } catch (error: any) {
      setResetError(error.message || "Failed to confirm password modification.");
    } finally {
      setIsResetLoading(false);
    }
  };

  // Autocomplete OTP shifts
  const handleOtpChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;

    const newValues = [...otpValues];
    newValues[index] = val.slice(-1);
    setOtpValues(newValues);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const newValues = [...otpValues];
        newValues[index - 1] = "";
        setOtpValues(newValues);
        const prevInput = document.getElementById(`otp-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setOtpValues(digits);
    
    const lastInput = document.getElementById("otp-5");
    lastInput?.focus();
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetStep("request");
    setResetError("");
    setResetSuccess("");
    setPendingPassword("");
    setPendingSecurityKey("");
    setOtpValues(Array(6).fill(""));
    resetChangeForm();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
      <Link 
        href="/login" 
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Normal Sign In
      </Link>

      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 p-2.5 rounded-2xl bg-zinc-950 border border-red-500/20 text-red-500">
            <ShieldAlert className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Super Admin Portal</h2>
          <p className="text-xs text-zinc-500 font-semibold mt-1">Authorized access only. Log in to control panel.</p>
        </div>

        <GlowCard className="border border-red-550/10 shadow-none bg-zinc-950/5" glowColor="rgba(239, 68, 68, 0.02)">
          <div className="p-8">
            <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmitLogin(onLoginSubmit)}>
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
                <label htmlFor="email" className="text-xs font-bold text-zinc-500">Super Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="contact.primeinbox@gmail.com" 
                    {...registerLogin("email")}
                    className="h-11 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all font-semibold"
                  />
                </div>
                {loginErrors.email && <p className="text-[11px] font-bold text-red-500 mt-0.5">{loginErrors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold text-zinc-500">Super Admin Password</label>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-[11px] font-bold text-red-650 hover:underline"
                  >
                    Modify Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    placeholder="••••••••" 
                    {...registerLogin("password")}
                    className="h-11 pl-10 pr-10 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginErrors.password && <p className="text-[11px] font-bold text-red-500 mt-0.5">{loginErrors.password.message}</p>}
              </div>

              {/* Security Key */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="securityKey" className="text-xs font-bold text-zinc-500">Super Admin Security Key</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type={showSecurityKey ? "text" : "password"} 
                    id="securityKey" 
                    placeholder="••••••••" 
                    {...registerLogin("securityKey")}
                    className="h-11 pl-10 pr-10 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-sm placeholder-zinc-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityKey(!showSecurityKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
                  >
                    {showSecurityKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginErrors.securityKey && <p className="text-[11px] font-bold text-red-500 mt-0.5">{loginErrors.securityKey.message}</p>}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  {...registerLogin("rememberMe")}
                  className="h-4 w-4 rounded border-zinc-350 accent-red-650 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-zinc-500 font-semibold cursor-pointer select-none">
                  Keep session active
                </label>
              </div>

              <ShimmerButton 
                type="submit"
                disabled={isLoading}
                className="h-11 w-full mt-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
                shimmerColor="#EF4444"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Authenticate Super Admin"
                )}
              </ShimmerButton>
            </form>
          </div>
        </GlowCard>
      </div>

      {/* Password Reset Modal Overlay */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <style>{`
            @keyframes scaleUp {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animate-modal-entry {
              animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
          `}</style>

          <div className="w-full max-w-[420px] bg-white border border-zinc-200/60 rounded-2xl shadow-2xl p-6 text-center space-y-6 relative animate-modal-entry">
            
            {/* Exit Button */}
            <button
              onClick={closeResetModal}
              className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-all"
            >
              <XCircle className="w-4 h-4" />
            </button>

            {resetStep === "request" && (
              <>
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 border border-red-100/50">
                    <Key className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">Modify Password</h3>
                  <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                    Verify security key to request modification OTP on your security email.
                  </p>
                </div>

                {resetError && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-100 text-center animate-in fade-in duration-200">
                    {resetError}
                  </div>
                )}

                <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmitChange(onRequestOtp)}>
                  {/* Security Key */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reset-security-key" className="text-[11px] font-bold text-zinc-500">Security Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                      <input 
                        type="password" 
                        id="reset-security-key" 
                        placeholder="Enter super admin security key" 
                        {...registerChange("securityKey")}
                        className="h-10 pl-9 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs focus:outline-none focus:border-red-500/50 font-semibold"
                      />
                    </div>
                    {changeErrors.securityKey && <p className="text-[10px] font-bold text-red-500 mt-0.5">{changeErrors.securityKey.message}</p>}
                  </div>

                  {/* New Password */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="new-password" className="text-[11px] font-bold text-zinc-500">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        id="new-password" 
                        placeholder="Enter new password" 
                        {...registerChange("password")}
                        className="h-10 pl-9 pr-9 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs focus:outline-none focus:border-red-500/50 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 text-zinc-400"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {changeErrors.password && <p className="text-[10px] font-bold text-red-500 mt-0.5">{changeErrors.password.message}</p>}

                    {/* Criteria checklist */}
                    {passwordVal && (
                      <div className="mt-1 space-y-1 bg-zinc-50 rounded-xl p-2.5 text-[9px] text-zinc-500 border border-zinc-100 font-semibold">
                        <div className="flex items-center justify-between">
                          <span>Password Strength:</span>
                          <span className={`px-1 rounded text-white ${strengthInfo.color}`}>{strengthInfo.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 mt-0.5">
                          <span className={criteria.length ? "text-emerald-600" : "text-zinc-350"}>• 8+ chars</span>
                          <span className={criteria.upper ? "text-emerald-600" : "text-zinc-350"}>• Uppercase</span>
                          <span className={criteria.lower ? "text-emerald-600" : "text-zinc-350"}>• Lowercase</span>
                          <span className={criteria.number ? "text-emerald-600" : "text-zinc-350"}>• Number</span>
                          <span className={`col-span-2 ${criteria.special ? "text-emerald-600" : "text-zinc-350"}`}>• Special symbol</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1">
                    <label htmlFor="confirm-new-password" className="text-[11px] font-bold text-zinc-500">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                      <input 
                        type={showConfirmNewPassword ? "text" : "password"} 
                        id="confirm-new-password" 
                        placeholder="Confirm new password" 
                        {...registerChange("confirmPassword")}
                        className="h-10 pl-9 pr-9 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs focus:outline-none focus:border-red-500/50 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 text-zinc-400"
                      >
                        {showConfirmNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {changeErrors.confirmPassword && <p className="text-[10px] font-bold text-red-500 mt-0.5">{changeErrors.confirmPassword.message}</p>}
                  </div>

                  <ShimmerButton
                    type="submit"
                    disabled={isResetLoading}
                    className="h-10 w-full mt-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-1.5"
                    shimmerColor="#EF4444"
                  >
                    {isResetLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating OTP...
                      </>
                    ) : (
                      "Request Verification OTP"
                    )}
                  </ShimmerButton>
                </form>
              </>
            )}

            {resetStep === "verify" && (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">Enter Verification Code</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                    We sent a 6-digit verification code to <span className="text-red-650 font-bold">saptechnoeditors@gmail.com</span>. Enter it below to modify the password.
                  </p>
                </div>

                {resetSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100/50 text-center animate-in fade-in duration-200">
                    {resetSuccess}
                  </div>
                )}
                {resetError && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-100 text-center animate-in fade-in duration-200">
                    {resetError}
                  </div>
                )}

                {/* OTP code grid */}
                <div className="flex justify-center gap-2">
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 focus:bg-white transition-all font-mono"
                    />
                  ))}
                </div>

                <div className="space-y-4 pt-2">
                  <ShimmerButton
                    onClick={onConfirmPasswordChange}
                    disabled={isResetLoading || otpValues.join("").length < 6}
                    className="h-10 w-full rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-750 flex items-center justify-center gap-1.5"
                    shimmerColor="#EF4444"
                  >
                    {isResetLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      "Verify & Change Password"
                    )}
                  </ShimmerButton>

                  <div className="text-xs font-bold">
                    <button
                      onClick={() => setResetStep("request")}
                      className="text-zinc-400 hover:text-zinc-700 hover:underline cursor-pointer"
                    >
                      Back to details
                    </button>
                  </div>
                </div>
              </>
            )}

            {resetStep === "success" && (
              <div className="py-4 space-y-4 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-55/10 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100/50">
                  <svg className="w-8 h-8 stroke-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                    <path className="animate-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">Password Changed!</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                    The Super Admin credentials have been updated in the database. You can now log in using the new password.
                  </p>
                </div>
                <button
                  onClick={closeResetModal}
                  className="h-9 px-5 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
