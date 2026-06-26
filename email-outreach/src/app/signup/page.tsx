"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/feedback";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Lock, User, Briefcase, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Phone, PhoneCall, Building2 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { businessTypes } from "@/lib/business-types";
import { cn } from "@/lib/utils";

// Selectable subscription plans (mirrors the pricing page)
const SIGNUP_PLANS = [
  { id: "SILVER", name: "Silver", price: "₹499", emails: "20,000 emails/mo" },
  { id: "GOLD", name: "Gold", price: "₹999", emails: "100,000 emails/mo", popular: true },
  { id: "PLATINUM", name: "Platinum", price: "₹1999", emails: "250,000 emails/mo" },
];

// Password validation regex rules
const minLength = 8;
const hasUpper = /[A-Z]/;
const hasLower = /[a-z]/;
const hasNumber = /[0-9]/;
const hasSpecial = /[^A-Za-z0-9]/;

// Business types imported from shared lib


const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid business email"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  businessType: z.string().min(1, "Please select a business type"),
  plan: z.enum(["SILVER", "GOLD", "PLATINUM"], { message: "Please select a plan" }),
  contactNo: z.string().min(6, "Contact number must be at least 6 characters"),
  whatsappNo: z.string().optional(),
  password: z
    .string()
    .min(minLength, `Password must be at least ${minLength} characters`)
    .regex(hasUpper, "Must contain at least one uppercase letter")
    .regex(hasLower, "Must contain at least one lowercase letter")
    .regex(hasNumber, "Must contain at least one number")
    .regex(hasSpecial, "Must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  acceptTerms: z.literal(true, {
    message: "You must accept the Terms of Service and Privacy Policy",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError, setOtpError] = useState("");
  
  const [generalError, setGeneralError] = useState("");
  const [resendStatus, setResendStatus] = useState("");

  // Countdown timer for resend lock
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    setOtpError("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail,
          token: otpValues.join(""),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to verify code.");
      }

      setVerifySuccess(true);
      // Removed toast success popup as the checkmark animation communicates success clearly

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setOtpError(error.message || "Invalid or expired OTP.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError("");
    setResendStatus("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend code.");
      }

      setResendStatus("Code resent!");
      setResendTimer(60);
      setOtpValues(Array(6).fill(""));
      setTimeout(() => {
        document.getElementById("otp-0")?.focus();
      }, 100);
      // Clear status message after 5 seconds
      setTimeout(() => {
        setResendStatus("");
      }, 5000);
    } catch (error: any) {
      setOtpError(error.message || "Failed to resend OTP.");
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      companyName: "",
      businessType: "",
      plan: "GOLD",
      contactNo: "",
      whatsappNo: "",
      password: "",
      confirmPassword: "",
      acceptTerms: undefined,
    },
  });

  const passwordVal = watch("password", "");

  // Preselect plan from ?plan= query param (e.g. coming from the pricing page)
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("plan")?.toUpperCase();
    if (param === "SILVER" || param === "GOLD" || param === "PLATINUM") {
      setValue("plan", param);
    }
  }, [setValue]);

  // Real-time password criteria verification
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

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setGeneralError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          companyName: data.companyName,
          businessType: data.businessType,
          plan: data.plan,
          contactNo: data.contactNo,
          whatsappNo: data.whatsappNo || null,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong during registration.");
      }

      // Open OTP modal directly without toast success popup
      setOtpEmail(data.email);
      setShowOtpModal(true);
      setResendTimer(60);
      setTimeout(() => {
        document.getElementById("otp-0")?.focus();
      }, 150);
    } catch (error: any) {
      if (error.message === "Email address already registered") {
        setError("email", {
          type: "manual",
          message: "Email address already registered",
        });
      } else {
        setGeneralError(error.message || "Failed to create account.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Removed old email verification fallback page block

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to home
      </Link>

      <div className="w-full max-w-[640px] my-6">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group mb-3">
            <img 
              src="/logo/primeinbox-logo.png" 
              alt="PrimeInbox Logo" 
              className="h-9 w-auto group-hover:scale-105 transition-all" 
            />
          </Link>
          <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">Start your 14-day free trial</h2>
        </div>

        <GlowCard className="border border-zinc-200/50 shadow-none" glowColor="rgba(59, 130, 246, 0.03)">
          <div className="p-6">
            <form className="flex flex-col gap-3 text-left" onSubmit={handleSubmit(onSubmit)}>
              {generalError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-100 text-center animate-in fade-in duration-200">
                  {generalError}
                </div>
              )}

              {/* Plan selector */}
              <Controller
                name="plan"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-500">Choose your plan</label>
                    <div className="grid grid-cols-3 gap-2">
                      {SIGNUP_PLANS.map((p) => {
                        const selected = field.value === p.id;
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => field.onChange(p.id)}
                            className={cn(
                              "relative text-left rounded-xl border p-2.5 transition-all",
                              selected
                                ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/30"
                                : "border-zinc-200/80 bg-white hover:border-zinc-300"
                            )}
                          >
                            {p.popular && (
                              <span className="absolute -top-1.5 right-2 px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-bold uppercase tracking-wide rounded-full">
                                Popular
                              </span>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-zinc-900">{p.name}</span>
                              {selected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                            </div>
                            <div className="text-sm font-black text-zinc-900 mt-0.5">
                              {p.price}
                              <span className="text-[9px] font-semibold text-zinc-400">/mo</span>
                            </div>
                            <div className="text-[9px] text-zinc-500 font-semibold mt-0.5">{p.emails}</div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.plan && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.plan.message}</p>}
                  </div>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {/* Name */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="text-[11px] font-bold text-zinc-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input 
                      type="text" 
                      id="name" 
                      placeholder="Enter name" 
                      {...register("name")}
                      className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-450 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-[11px] font-bold text-zinc-500">Work Email</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input 
                      type="email" 
                      id="email" 
                      placeholder="Enter business email" 
                      {...register("email")}
                      className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-450 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.email.message}</p>}
                </div>

                {/* Company */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="companyName" className="text-[11px] font-bold text-zinc-500">Company Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input 
                      type="text" 
                      id="companyName" 
                      placeholder="Enter company name" 
                      {...register("companyName")}
                      className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-450 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                  </div>
                  {errors.companyName && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.companyName.message}</p>}
                </div>

                {/* Business Type */}
                <Controller
                  name="businessType"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={businessTypes}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select business type"
                      label="Business Type"
                      error={errors.businessType?.message}
                      icon={<Building2 className="w-3.5 h-3.5" />}
                    />
                  )}
                />

                {/* Contact Number */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="contactNo" className="text-[11px] font-bold text-zinc-500">Contact Number*</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input 
                      type="text" 
                      id="contactNo" 
                      placeholder="Enter contact number" 
                      {...register("contactNo")}
                      className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-450 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                  </div>
                  {errors.contactNo && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.contactNo.message}</p>}
                </div>

                {/* WhatsApp Number */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="whatsappNo" className="text-[11px] font-bold text-zinc-500 flex items-center justify-between">
                    <span>WhatsApp Number</span>
                    <span className="text-[9px] text-zinc-400 font-medium lowercase">optional</span>
                  </label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input 
                      type="text" 
                      id="whatsappNo" 
                      placeholder="Enter WhatsApp number (optional)" 
                      {...register("whatsappNo")}
                      className="h-10 pl-10 pr-4 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-450 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                  </div>
                  {errors.whatsappNo && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.whatsappNo.message}</p>}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className="text-[11px] font-bold text-zinc-500">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      id="password" 
                      placeholder="Enter password" 
                      {...register("password")}
                      className="h-10 pl-10 pr-10 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-450 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.password.message}</p>}

                  {/* Password Strength Meter & Real-time Indicator */}
                  {passwordVal && (
                    <div className="mt-1 space-y-1.5 border border-zinc-100 rounded-xl p-2.5 bg-zinc-50/50 text-[10px] text-zinc-500">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Password Strength:</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] text-white ${strengthInfo.color}`}>
                          {strengthInfo.label}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${strengthInfo.color} transition-all duration-300`} 
                          style={{ width: `${(strengthCount / 5) * 100}%` }}
                        />
                      </div>
                      {/* Requirements checklist */}
                      <div className="grid grid-cols-2 gap-y-1 gap-x-2 mt-0.5 font-semibold">
                        <span className="flex items-center gap-1">
                          {criteria.length ? <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-pulse" /> : <XCircle className="w-3 h-3 text-zinc-350" />}
                          8+ chars
                        </span>
                        <span className="flex items-center gap-1">
                          {criteria.upper ? <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-pulse" /> : <XCircle className="w-3 h-3 text-zinc-350" />}
                          Uppercase
                        </span>
                        <span className="flex items-center gap-1">
                          {criteria.lower ? <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-pulse" /> : <XCircle className="w-3 h-3 text-zinc-350" />}
                          Lowercase
                        </span>
                        <span className="flex items-center gap-1">
                          {criteria.number ? <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-pulse" /> : <XCircle className="w-3 h-3 text-zinc-350" />}
                          Number
                        </span>
                        <span className="flex items-center gap-1 col-span-2">
                          {criteria.special ? <CheckCircle2 className="w-3 h-3 text-emerald-500 animate-pulse" /> : <XCircle className="w-3 h-3 text-zinc-350" />}
                          Special symbol (!@#$ etc)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmPassword" className="text-[11px] font-bold text-zinc-500">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      id="confirmPassword" 
                      placeholder="Confirm password" 
                      {...register("confirmPassword")}
                      className="h-10 pl-10 pr-10 w-full rounded-xl border border-zinc-200/80 bg-white text-zinc-800 text-xs placeholder-zinc-450 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100 text-zinc-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              {/* Accept Terms Checkbox */}
              <div className="flex flex-col gap-1 mt-0.5">
                <label className="flex items-start gap-2 text-xs text-zinc-500 font-semibold cursor-pointer">
                  <input 
                    type="checkbox" 
                    {...register("acceptTerms")}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-350 accent-indigo-650"
                  />
                  <span className="text-[11px] leading-tight">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary font-bold hover:underline">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-[10px] font-bold text-red-500 mt-0.5">{errors.acceptTerms.message}</p>}
              </div>

              <ShimmerButton 
                type="submit"
                disabled={isLoading}
                className="h-10 w-full mt-1.5 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2"
                shimmerColor="#3B82F6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </ShimmerButton>
            </form>
          </div>
        </GlowCard>

        {/* Footer Link */}
        <p className="text-center text-xs text-zinc-500 font-semibold mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* OTP Modal Overlay */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <style>{`
            @keyframes scaleUp {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes checkmarkDraw {
              to { stroke-dashoffset: 0; }
            }
            .animate-modal-entry {
              animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .animate-checkmark {
              stroke-dasharray: 80;
              stroke-dashoffset: 80;
              animation: checkmarkDraw 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
            }
          `}</style>

          <div className="w-full max-w-[400px] bg-white border border-zinc-200/60 rounded-2xl shadow-2xl p-6 text-center space-y-6 relative animate-modal-entry">
            {!verifySuccess ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">Enter Verification Code</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                    We sent a 6-digit code to <span className="text-blue-600 font-bold">{otpEmail}</span>. Enter it below to verify your email.
                  </p>
                </div>

                {/* 6 OTP Input Boxes */}
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
                      className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5 text-center animate-pulse">
                    {otpError}
                  </p>
                )}

                <div className="space-y-4">
                  <ShimmerButton
                    onClick={handleVerifyOtp}
                    disabled={isVerifying || otpValues.join("").length < 6}
                    className="h-10 w-full rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black flex items-center justify-center gap-2"
                    shimmerColor="#3B82F6"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying Code...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </ShimmerButton>

                  <div className="text-xs text-zinc-400 font-bold">
                    {resendTimer > 0 ? (
                      <span>Resend code in {resendTimer}s</span>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-all cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                    {resendStatus && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 animate-pulse">
                        {resendStatus}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowOtpModal(false)}
                  className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-zinc-650 rounded-lg hover:bg-zinc-100 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* Success Anim screen */
              <div className="py-4 space-y-4 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100/50">
                  <svg className="w-8 h-8 stroke-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                    <path className="animate-checkmark" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight">Email Verified!</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                    Your account is now active. Redirecting you to login...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
