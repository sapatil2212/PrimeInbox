"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CreditCard,
  LogOut,
  RefreshCw,
  ShieldX,
  CheckCircle2,
} from "lucide-react";
import { CheckoutPlans } from "@/components/billing/checkout-plans";
import { toast } from "@/components/ui/feedback";

interface SuspendedAccountProps {
  currentPlan: string;
  prefill?: { name?: string; email?: string; contact?: string };
  workspaceSlug?: string;
}

export function SuspendedAccount({
  currentPlan,
  prefill,
  workspaceSlug,
}: SuspendedAccountProps) {
  const router = useRouter();
  const [showPayment, setShowPayment] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    }
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment confirmed! Restoring your workspace access…");
    setTimeout(() => {
      router.refresh();
    }, 1200);
  };

  if (showPayment) {
    // Full checkout flow after user clicks "Complete Payment"
    return (
      <div className="min-h-screen w-full bg-zinc-50 flex flex-col items-center justify-start px-4 py-12 overflow-y-auto">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Back button */}
          <button
            onClick={() => setShowPayment(false)}
            className="self-start mb-6 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            ← Back
          </button>

          <div className="text-center max-w-xl mb-10">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">
              Complete Your Payment
            </h1>
            <p className="text-sm text-zinc-500 font-medium mt-2">
              Select your plan and complete payment to immediately restore access to your workspace.
            </p>
          </div>

          <div className="w-full">
            <CheckoutPlans
              currentPlan={currentPlan}
              prefill={prefill}
              onSuccess={handlePaymentSuccess}
            />
          </div>

          <button
            onClick={handleLogout}
            className="mt-8 flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out instead
          </button>
        </div>
      </div>
    );
  }

  // ── Suspension landing page ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-red-50 via-white to-zinc-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          {/* Red header strip */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldX className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight">
                  Workspace Suspended
                </h1>
                <p className="text-red-100 text-xs font-medium mt-0.5">
                  Automatic payment could not be processed
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7 space-y-5">
            {/* Alert box */}
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">Automatic renewal failed</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  We were unable to charge your registered payment method for your{" "}
                  <strong>{currentPlan}</strong> subscription. Your workspace{" "}
                  {workspaceSlug && (
                    <span className="font-mono bg-amber-100 px-1 rounded">/{workspaceSlug}</span>
                  )}{" "}
                  has been temporarily suspended until payment is completed.
                </p>
              </div>
            </div>

            {/* What's affected */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Suspended features
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Email campaigns",
                  "Lead management",
                  "SMTP accounts",
                  "Analytics & reports",
                  "Templates",
                  "Team access",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200/70"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-500">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Common reasons */}
            <div className="text-[11px] text-zinc-500 leading-relaxed space-y-1">
              <p className="font-semibold text-zinc-600">Common reasons for failure:</p>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                <li>Insufficient balance in your bank account</li>
                <li>Card expired or payment limit exceeded</li>
                <li>Bank declined the auto-debit transaction</li>
              </ul>
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowPayment(true)}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md shadow-red-200 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Complete Payment & Restore Access
            </button>

            {/* Refresh hint */}
            <button
              onClick={() => router.refresh()}
              className="w-full h-9 rounded-xl border border-zinc-200 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              I've already paid — check status
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 border-t border-zinc-100 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-zinc-400">
                Need help?{" "}
                <a
                  href="mailto:contact.primeinbox@gmail.com"
                  className="text-indigo-500 font-semibold hover:underline"
                >
                  contact.primeinbox@gmail.com
                </a>
              </p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <LogOut className="w-3 h-3" /> Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
