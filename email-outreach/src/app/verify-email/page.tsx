"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "@/components/ui/feedback";
import { GlowCard } from "@/components/ui/glow-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Mail, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token was provided in the URL.");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Verification failed");
        }

        setStatus("success");
        // Removed success toast since the UI already changes to a full success checkmark layout
        
        // Auto-redirect to login with parameter after 3 seconds
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "The verification link is invalid or has expired.");
      }
    };

    verifyToken();
  }, [token, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendStatus("");
    setResendError("");
    if (!resendEmail) {
      setResendError("Please enter your email address.");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to resend email.");
      }

      setResendStatus("Verification email resent successfully!");
      setResendEmail("");
      setTimeout(() => setResendStatus(""), 5000);
    } catch (error: any) {
      setResendError(error.message || "Failed to resend email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-[440px]">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <img src="/logo/primeinbox-logo.png" alt="PrimeInbox Logo" className="h-9 w-auto group-hover:scale-105 transition-all" />
        </Link>
        <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Email Verification</h2>
      </div>

      <GlowCard className="border border-zinc-200/50 shadow-none" glowColor="rgba(59, 130, 246, 0.05)">
        <div className="p-8">
          {status === "loading" && (
            <div className="text-center py-6 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-650 mx-auto" />
              <p className="text-sm font-semibold text-zinc-650">Verifying your email address...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-zinc-900 text-lg">Verification Successful!</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Your email has been verified. We are redirecting you to sign in...
                </p>
              </div>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline pt-2">
                Go to Login <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-lg">Verification Failed</h3>
                  <p className="text-xs text-red-500/80 font-semibold">{errorMessage}</p>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-6 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-900">Resend verification link</h4>
                  <p className="text-[11px] text-zinc-500">Enter your business email address and we'll send you a new link.</p>
                </div>
                {resendStatus && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-100/50 text-center animate-in fade-in duration-200">
                    {resendStatus}
                  </div>
                )}
                {resendError && (
                  <div className="p-2.5 rounded-xl bg-red-50 text-red-500 text-[11px] font-bold border border-red-100 text-center animate-in fade-in duration-200">
                    {resendError}
                  </div>
                )}
                <form onSubmit={handleResend} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="h-10 px-3 flex-1 rounded-xl border border-zinc-200 bg-white text-zinc-800 text-xs font-semibold focus:outline-none focus:border-blue-500/50"
                  />
                  <ShimmerButton
                    type="submit"
                    disabled={isResending}
                    className="h-10 px-4 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-black flex items-center gap-1"
                    shimmerColor="#3B82F6"
                  >
                    {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                  </ShimmerButton>
                </form>
              </div>
            </div>
          )}
        </div>
      </GlowCard>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative z-10">
      <Suspense fallback={
        <div className="text-center py-6 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-650 mx-auto" />
          <p className="text-sm font-semibold text-zinc-650">Loading page...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
