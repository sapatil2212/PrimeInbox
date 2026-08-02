"use client";

import { useRouter } from "next/navigation";
import { LockKeyhole, LogOut, AlertTriangle, RefreshCw } from "lucide-react";
import { CheckoutPlans } from "@/components/billing/checkout-plans";
import { toast } from "@/components/ui/feedback";

export function DeactivatedAccount({
  currentPlan,
  prefill,
}: {
  currentPlan?: string;
  prefill?: { name?: string; email?: string; contact?: string };
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 flex flex-col items-center justify-start px-4 py-12 overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="text-center max-w-xl">
          {/* Deactivated Icon */}
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900">
            Your Account Has Been Deactivated
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
            Your subscription was cancelled and the billing period has ended.
            Reactivate your workspace by choosing a plan below to continue
            using PrimeInbox.
          </p>

          {/* Info Banner */}
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-2 justify-center">
            <RefreshCw className="w-4 h-4 shrink-0 text-amber-600" />
            Your data is safely preserved. Subscribe to regain full access instantly.
          </div>
        </div>

        <div className="w-full mt-10">
          <CheckoutPlans
            currentPlan={currentPlan}
            prefill={prefill}
            onSuccess={() => {
              toast.success("Welcome back! Reactivating your workspace...");
              setTimeout(() => router.refresh(), 800);
            }}
          />
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Log out
        </button>
      </div>
    </div>
  );
}
