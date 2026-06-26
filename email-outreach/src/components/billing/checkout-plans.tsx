"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/plans";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutPlans({
  currentPlan,
  isPaid,
  onSuccess,
  prefill,
}: {
  currentPlan?: string;
  isPaid?: boolean;
  onSuccess?: () => void;
  prefill?: { name?: string; email?: string; contact?: string };
}) {
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setBusyPlan(planId);
    try {
      // 1. Create order
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout");

      // 2. Load Razorpay
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Could not load payment gateway. Check your connection.");

      // 3. Open checkout
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "PrimeInbox",
        description: `${data.planName} plan subscription`,
        order_id: data.orderId,
        prefill: prefill || {},
        theme: { color: "#4f46e5" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
            toast.success(verifyData.message || "Subscription activated!");
            onSuccess?.();
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setBusyPlan(null),
        },
      });
      rzp.on("payment.failed", (resp: any) => {
        toast.error(resp?.error?.description || "Payment failed");
        setBusyPlan(null);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {PLANS.map((plan) => {
        const isEnrolled = currentPlan === plan.id;
        const isActivePaid = isEnrolled && !!isPaid;
        const busy = busyPlan === plan.id;
        return (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-2xl border p-5 transition-all",
              isEnrolled
                ? "border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : plan.popular
                ? "border-indigo-300 bg-white shadow-lg shadow-indigo-500/5"
                : "border-zinc-200 bg-white"
            )}
          >
            {isEnrolled ? (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Current Plan
              </span>
            ) : plan.popular ? (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Most Popular
              </span>
            ) : null}
            <h3 className="text-lg font-black text-zinc-900">{plan.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-black text-zinc-900">₹{plan.price}</span>
              <span className="text-xs text-zinc-400 font-semibold">/mo</span>
            </div>
            <ul className="mt-5 space-y-2.5 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 font-semibold">
                  <Check className={cn("w-4 h-4 shrink-0 mt-0.5", isEnrolled ? "text-emerald-600" : plan.popular ? "text-indigo-600" : "text-zinc-400")} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              disabled={isActivePaid || busy}
              onClick={() => handleSubscribe(plan.id)}
              className={cn(
                "mt-6 h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-default",
                isActivePaid
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : isEnrolled
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : plan.popular
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : "bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700"
              )}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isActivePaid ? (
                "Current Plan"
              ) : isEnrolled ? (
                `Activate — ₹${plan.price}/mo`
              ) : (
                `Subscribe — ₹${plan.price}/mo`
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
